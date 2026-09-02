const STORAGE_KEY = "aebk-state-v1";
let stateCache = null;

function loadState() {
  if (stateCache) return stateCache;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    stateCache = JSON.parse(saved);
    return stateCache;
  }
  const seeded = { ...window.SALON_SEED, bookings: [] };
  stateCache = seeded;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return stateCache;
}

function saveState(state) {
  stateCache = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  fetch("/api/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  }).catch(() => {});
}

async function hydrateState() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) return;
    stateCache = await response.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCache));
    render();
  } catch (error) {
    return;
  }
}

function currency(value) {
  return `R${Number(value || 0).toLocaleString("en-ZA")}`;
}

function renderStats(state) {
  document.querySelector("#pendingCount").textContent = state.bookings.filter((b) => b.status === "needs_review").length;
  document.querySelector("#confirmedCount").textContent = state.bookings.filter((b) => b.status === "confirmed").length;
  document.querySelector("#serviceCount").textContent = state.services.length;
}

function updateBooking(id, status) {
  const state = loadState();
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return;
  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  saveState(state);
  render();
}

function renderBookings(state) {
  const rows = document.querySelector("#bookingRows");
  if (state.bookings.length === 0) {
    rows.innerHTML = `<article class="admin-item"><div><h3>No bookings yet</h3><p>New bookings will appear here for payment verification and changes.</p></div></article>`;
    return;
  }
  rows.innerHTML = state.bookings
    .slice()
    .reverse()
    .map((booking) => `
      <article class="admin-item">
        <div>
          <h3>${booking.client.name} - ${booking.serviceName}</h3>
          <p>${booking.branchName} | ${booking.date} at ${booking.time} | Ref ${booking.reference}</p>
          <p>Paid now: ${currency(booking.amountDue)} | Balance: ${currency(booking.balance)}</p>
          ${renderProofLinks(booking)}
          <span class="status ${booking.status}">${booking.status.replace("_", " ")}</span>
        </div>
        <div class="admin-actions">
          <button type="button" onclick="updateBooking('${booking.id}', 'confirmed')">Approve</button>
          <button type="button" onclick="updateBooking('${booking.id}', 'needs_review')">Review</button>
          <button type="button" onclick="updateBooking('${booking.id}', 'rejected')">Reject</button>
          <button type="button" onclick="updateBooking('${booking.id}', 'cancelled')">Cancel</button>
        </div>
      </article>
    `)
    .join("");
}

function renderProofLinks(booking) {
  if (!booking.proofFiles?.length) return "";
  return `<p>${booking.proofFiles
    .map((proof) => `<a href="${proof.dataUrl}" target="_blank" rel="noreferrer">${proof.name}</a>`)
    .join(" | ")}</p>`;
}

function editService(id) {
  const state = loadState();
  const service = state.services.find((item) => item.id === id);
  if (!service) return;
  document.querySelector("#serviceId").value = service.id;
  document.querySelector("#serviceName").value = service.name;
  document.querySelector("#serviceCategory").value = service.category;
  document.querySelector("#servicePrice").value = service.price;
  document.querySelector("#serviceSpecial").value = service.specialPrice || "";
  document.querySelector("#serviceDuration").value = service.duration;
  document.querySelector("#serviceDeposit").value = service.depositType;
  document.querySelector("#serviceImage").value = "";
  document.querySelectorAll('[name="branch"]').forEach((input) => {
    input.checked = service.branches.includes(input.value);
  });
  document.querySelector("#serviceForm").scrollIntoView({ behavior: "smooth" });
}

function deleteService(id) {
  const state = loadState();
  state.services = state.services.filter((item) => item.id !== id);
  saveState(state);
  render();
}

function renderServices(state) {
  document.querySelector("#serviceRows").innerHTML = state.services
    .map((service) => `
      <article class="admin-item">
        <div>
          <h3>${service.name}</h3>
          <p>${service.category} | ${currency(service.specialPrice || service.price)} | ${service.duration} min | ${service.depositType === "full" ? "Full payment" : "50% deposit"}</p>
          <p>${service.branches.join(", ")}</p>
        </div>
        <div class="admin-actions">
          <button type="button" onclick="editService('${service.id}')">Edit</button>
          <button type="button" onclick="deleteService('${service.id}')">Remove</button>
        </div>
      </article>
    `)
    .join("");
}

function renderBranches(state) {
  document.querySelector("#branchRows").innerHTML = state.branches
    .map((branch) => `
      <article class="admin-item">
        <div>
          <h3>${branch.name}</h3>
          <p>${branch.address}</p>
          <p>${branch.policy}</p>
          <span class="status">${branch.bookingMode === "walk-ins" ? "Walk-ins only" : "Appointments"}</span>
        </div>
      </article>
    `)
    .join("");
}

function render() {
  const state = loadState();
  renderStats(state);
  renderBookings(state);
  renderServices(state);
  renderBranches(state);
}

document.querySelector("#serviceForm").addEventListener("submit", (event) => {
  event.preventDefault();
  saveService(event.target);
});

async function saveService(form) {
  const state = loadState();
  const id = document.querySelector("#serviceId").value || crypto.randomUUID();
  const existing = state.services.find((item) => item.id === id);
  const imageFile = document.querySelector("#serviceImage").files[0];
  const service = {
    id,
    name: document.querySelector("#serviceName").value,
    category: document.querySelector("#serviceCategory").value,
    price: Number(document.querySelector("#servicePrice").value),
    specialPrice: Number(document.querySelector("#serviceSpecial").value) || null,
    duration: Number(document.querySelector("#serviceDuration").value),
    depositType: document.querySelector("#serviceDeposit").value,
    branches: [...document.querySelectorAll('[name="branch"]:checked')].map((input) => input.value),
    image: imageFile ? await fileToDataUrl(imageFile) : existing?.image || "assets/Banner.jpeg",
    tags: existing?.tags || []
  };
  const index = state.services.findIndex((item) => item.id === id);
  if (index >= 0) state.services[index] = service;
  else state.services.push(service);
  saveState(state);
  form.reset();
  document.querySelector("#serviceId").value = "";
  render();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.querySelector("#resetDemo").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  render();
});

render();
hydrateState();
