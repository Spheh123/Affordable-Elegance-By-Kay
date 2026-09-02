const STORAGE_KEY = "aebk-state-v1";
const bookingForm = document.querySelector("#bookingForm");
const proofForm = document.querySelector("#proofForm");
const branchSelect = document.querySelector("#branch");
const serviceSelect = document.querySelector("#service");
const dateInput = document.querySelector("#bookingDate");
const timeSelect = document.querySelector("#bookingTime");
const priceSummary = document.querySelector("#priceSummary");
const branchPolicy = document.querySelector("#branchPolicy");
const paymentPanel = document.querySelector("#paymentPanel");
const countdown = document.querySelector("#countdown");
const paymentReference = document.querySelector("#paymentReference");
const verificationResult = document.querySelector("#verificationResult");

let activeBooking = null;
let timer = null;
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
    populateBranches();
    populateServices();
    populateTimes();
    renderCards();
  } catch (error) {
    return;
  }
}

function currency(value) {
  return `R${Number(value || 0).toLocaleString("en-ZA")}`;
}

function dayKey(dateValue) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(`${dateValue}T00:00:00`).getDay()];
}

function servicePrice(service, branchId) {
  if (branchId === "midrand" && service.midrandPrice) return service.midrandPrice;
  if (service.specialPrice) return service.specialPrice;
  return service.price;
}

function amountDue(service, branchId, paymentOption) {
  const total = servicePrice(service, branchId);
  if (paymentOption === "full" || service.depositType === "full") return total;
  return Math.ceil(total * (loadState().business.depositPercentage / 100));
}

function referenceFor(name) {
  const clean = (name || "CLIENT").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `AEK-${clean}-${Date.now().toString().slice(-5)}`;
}

function populateBranches() {
  const state = loadState();
  branchSelect.innerHTML = state.branches
    .map((branch) => `<option value="${branch.id}">${branch.name}</option>`)
    .join("");
}

function populateServices() {
  const state = loadState();
  const branchId = branchSelect.value;
  const services = state.services.filter((service) => service.branches.includes(branchId));
  serviceSelect.innerHTML = services
    .map((service) => `<option value="${service.id}">${service.name}</option>`)
    .join("");
  updateBookingUi();
}

function populateTimes() {
  const state = loadState();
  const branch = state.branches.find((item) => item.id === branchSelect.value);
  const service = selectedService();
  const selectedDate = dateInput.value;
  if (!branch || !selectedDate) {
    timeSelect.innerHTML = "";
    return;
  }
  const hours = branch.opening[dayKey(selectedDate)];
  if (!hours || branch.bookingMode === "walk-ins") {
    timeSelect.innerHTML = `<option value="">No appointment slots</option>`;
    return;
  }
  const [start, end] = hours.map((time) => Number(time.replace(":", "")));
  const slots = [];
  for (let hour = Math.floor(start / 100); hour < Math.floor(end / 100); hour += 1) {
    for (const minute of ["00", "30"]) {
      const stamp = `${String(hour).padStart(2, "0")}:${minute}`;
      if (Number(stamp.replace(":", "")) < end) slots.push(stamp);
    }
  }
  const availableSlots = slots.filter((slot) => {
    if (!service) return true;
    const slotStart = minutes(slot);
    const slotEnd = slotStart + service.duration;
    return !state.bookings.some((booking) => {
      if (booking.branchId !== branch.id || booking.date !== selectedDate) return false;
      if (["cancelled", "rejected", "expired"].includes(booking.status)) return false;
      const existingStart = minutes(booking.time);
      const existingEnd = existingStart + (booking.duration || 30);
      return slotStart < existingEnd && slotEnd > existingStart;
    });
  });
  timeSelect.innerHTML = availableSlots.length
    ? availableSlots.map((slot) => `<option>${slot}</option>`).join("")
    : `<option value="">Fully booked</option>`;
}

function minutes(time) {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function selectedService() {
  return loadState().services.find((service) => service.id === serviceSelect.value);
}

function selectedBranch() {
  return loadState().branches.find((branch) => branch.id === branchSelect.value);
}

function updateBookingUi() {
  const service = selectedService();
  const branch = selectedBranch();
  if (!service || !branch) return;

  const paymentOption = new FormData(bookingForm).get("paymentOption") || "deposit";
  const total = servicePrice(service, branch.id);
  const due = amountDue(service, branch.id, paymentOption);
  const balance = total - due;

  priceSummary.innerHTML = `
    <dt>Service</dt><dd>${service.name}</dd>
    <dt>Total</dt><dd>${currency(total)}</dd>
    <dt>Pay now</dt><dd>${currency(due)}</dd>
    <dt>Balance</dt><dd>${currency(balance)}</dd>
    <dt>Duration</dt><dd>${service.duration} minutes</dd>
  `;
  branchPolicy.textContent = branch.policy;
  document.querySelector('[data-show-for="midrand"]').classList.toggle("hidden", branch.id !== "midrand");
  document.querySelector('[data-show-for="lace"]').classList.toggle("hidden", !service.tags.includes("lace"));
}

function renderCards() {
  const state = loadState();
  const categories = [...new Map(state.services.map((item) => [item.category, item])).values()];
  document.querySelector("#serviceCards").innerHTML = categories
    .map((service) => `
      <article class="service-card">
        <img src="${service.image}" alt="${service.category}" />
        <div>
          <p>${service.category}</p>
          <h3>${service.name}</h3>
          <span>From ${currency(service.specialPrice || service.price)}</span>
        </div>
      </article>
    `)
    .join("");

  document.querySelector("#branchCards").innerHTML = state.branches
    .map((branch) => `
      <article class="branch-card">
        <h3>${branch.name}</h3>
        <p>${branch.address}</p>
        <span>${branch.bookingMode === "walk-ins" ? "Walk-ins only" : "Appointments available"}</span>
      </article>
    `)
    .join("");
}

function startCountdown(expiresAt) {
  clearInterval(timer);
  timer = setInterval(() => {
    const remaining = Math.max(0, expiresAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    countdown.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    if (remaining === 0) {
      clearInterval(timer);
      verificationResult.className = "verification-result error";
      verificationResult.textContent = "Payment window expired. Please create a fresh booking request.";
    }
  }, 250);
}

async function verifyPayment(files) {
  const formData = new FormData();
  formData.append("booking", JSON.stringify(activeBooking));
  [...files].slice(0, 2).forEach((file) => formData.append("proof", file));

  try {
    const response = await fetch("/api/verify-payment", { method: "POST", body: formData });
    if (response.ok) return response.json();
  } catch (error) {
    return { status: "needs_review", confidence: 0, reason: "AI verification is not enabled in this local preview yet." };
  }
  return { status: "needs_review", confidence: 0, reason: "Proof received. Admin verification is required." };
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const state = loadState();
  const form = new FormData(bookingForm);
  const service = selectedService();
  const branch = selectedBranch();
  const paymentOption = form.get("paymentOption");
  const total = servicePrice(service, branch.id);
  const due = amountDue(service, branch.id, paymentOption);
  const reference = referenceFor(form.get("fullName"));

  activeBooking = {
    id: crypto.randomUUID(),
    reference,
    status: "awaiting_payment",
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + state.business.paymentWindowMinutes * 60000,
    branchId: branch.id,
    branchName: branch.name,
    serviceId: service.id,
    serviceName: service.name,
    duration: service.duration,
    total,
    amountDue: due,
    balance: total - due,
    date: form.get("bookingDate"),
    time: form.get("bookingTime"),
    client: {
      name: form.get("fullName"),
      phone: form.get("phone"),
      whatsapp: form.get("whatsapp"),
      email: form.get("email")
    },
    notes: form.get("notes"),
    laceType: form.get("laceType"),
    plucking: form.get("plucking")
  };

  state.bookings.push(activeBooking);
  saveState(state);
  paymentReference.textContent = reference;
  paymentPanel.classList.remove("hidden");
  paymentPanel.scrollIntoView({ behavior: "smooth" });
  startCountdown(activeBooking.expiresAt);
});

proofForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const files = document.querySelector("#proofFiles").files;
  if (!activeBooking || files.length === 0 || files.length > 2) return;

  verificationResult.className = "verification-result";
  verificationResult.textContent = "Proof received. AI is checking amount, date, reference, and recipient details...";
  const proofFiles = await Promise.all([...files].map(fileToProofRecord));
  const result = await verifyPayment(files);

  const state = loadState();
  const booking = state.bookings.find((item) => item.id === activeBooking.id);
  booking.status = result.status === "approved" ? "confirmed" : "needs_review";
  booking.aiResult = result;
  booking.proofFiles = proofFiles;
  saveState(state);

  verificationResult.className = `verification-result ${booking.status === "confirmed" ? "success" : "warning"}`;
  verificationResult.textContent =
    booking.status === "confirmed"
      ? `Booking confirmed. Reference ${booking.reference}. Balance due: ${currency(booking.balance)}.`
      : `Proof uploaded, but admin review is needed. Reason: ${result.reason}`;
});

function fileToProofRecord(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

branchSelect.addEventListener("change", () => {
  populateServices();
  populateTimes();
});
serviceSelect.addEventListener("change", updateBookingUi);
dateInput.addEventListener("change", populateTimes);
bookingForm.addEventListener("input", updateBookingUi);

dateInput.min = new Date().toISOString().split("T")[0];
populateBranches();
populateServices();
populateTimes();
renderCards();
hydrateState();
