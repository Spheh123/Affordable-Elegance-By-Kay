const STORAGE_KEY = "aebk-state-v1";
let stateCache = null;
let messageTimer = null;
const activeStatuses = ["awaiting_payment", "needs_review", "confirmed"];

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function todayValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function minutes(time) {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function addMinutes(time, duration) {
  const total = minutes(time) + Number(duration || 30);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatLongDate(dateValue) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateValue}T00:00:00`));
}

function statusLabel(status) {
  return String(status || "pending").replaceAll("_", " ");
}

function dayKey(dateValue) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(`${dateValue}T00:00:00`).getDay()];
}

function shortDate(dateValue) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(new Date(`${dateValue}T00:00:00`));
}

function servicePrice(service, branchId) {
  if (branchId === "midrand" && service?.midrandPrice) return service.midrandPrice;
  if (service?.specialPrice) return service.specialPrice;
  return service?.price || 0;
}

function referenceFor(name) {
  const clean = (name || "CLIENT").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `AEK-${clean}-${Date.now().toString().slice(-5)}`;
}

function activeBooking(booking) {
  return activeStatuses.includes(booking.status);
}

function roundedCurrentMinutes() {
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return Math.ceil(minutesNow / 30) * 30;
}

function slotCandidates(branch, dateValue, duration = 30) {
  const hours = branch?.opening?.[dayKey(dateValue)];
  if (!hours) return [];
  const [start, end] = hours.map(minutes);
  const slots = [];
  const minimum = dateValue === todayValue() ? roundedCurrentMinutes() : start;
  for (let slot = start; slot + Number(duration || 30) <= end; slot += 30) {
    if (slot >= minimum) slots.push(`${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`);
  }
  return slots;
}

function availableStarts(state, branch, service, dateValue) {
  if (!branch || !service || !branch.opening?.[dayKey(dateValue)]) return [];
  const duration = Number(service.duration || 30);
  const slots = slotCandidates(branch, dateValue, duration);
  if (branch.bookingMode === "walk-ins") return slots;

  return slots.filter((slot) => {
    const slotStart = minutes(slot);
    const slotEnd = slotStart + duration;
    return !state.bookings.some((booking) => {
      if (booking.branchId !== branch.id || booking.date !== dateValue || !activeBooking(booking)) return false;
      const existingStart = minutes(booking.time);
      const existingEnd = existingStart + Number(booking.duration || 30);
      return slotStart < existingEnd && slotEnd > existingStart;
    });
  });
}

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function whatsappNumber(value) {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
}

function renderClientLinks(booking) {
  const phone = booking.client?.phone || booking.client?.whatsapp || "";
  const tel = phoneDigits(phone);
  const wa = whatsappNumber(booking.client?.whatsapp || phone);
  const links = [];
  if (tel) links.push(`<a href="tel:${tel}">Call client</a>`);
  if (wa) links.push(`<a href="https://wa.me/${wa}" target="_blank" rel="noreferrer">WhatsApp</a>`);
  return links.length ? `<p class="client-links">${links.join(" | ")}</p>` : "";
}

function showMessage(message) {
  const messageBox = document.querySelector("#adminMessage");
  messageBox.textContent = message;
  messageBox.classList.add("visible");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => messageBox.classList.remove("visible"), 3200);
}

function renderStats(state) {
  document.querySelector("#pendingCount").textContent = state.bookings.filter((b) => ["awaiting_payment", "needs_review"].includes(b.status)).length;
  document.querySelector("#confirmedCount").textContent = state.bookings.filter((b) => b.status === "confirmed").length;
  document.querySelector("#serviceCount").textContent = state.services.length;
}

function renderBusinessSettings(state) {
  const business = state.business;
  document.querySelector("#bannerNoticeInput").value = business.bannerNotice || "";
  document.querySelector("#cashNoticeInput").value = business.cashNotice || "";
  document.querySelector("#depositPercentageInput").value = business.depositPercentage || 50;
  document.querySelector("#paymentWindowInput").value = business.paymentWindowMinutes || 15;
  document.querySelector("#bankNameInput").value = business.bank?.name || "";
  document.querySelector("#bankHolderInput").value = business.bank?.accountHolder || "";
  document.querySelector("#bankAccountInput").value = business.bank?.accountNumber || "";
  document.querySelector("#bankMobileInput").value = business.bank?.linkedMobile || "";
}

function renderAvailabilityFilters(state) {
  const branchSelect = document.querySelector("#availabilityBranch");
  const serviceSelect = document.querySelector("#availabilityService");
  const selectedBranch = branchSelect.value || state.branches[0]?.id || "";
  const selectedService = serviceSelect.value;

  branchSelect.innerHTML = state.branches
    .map((branch) => `<option value="${escapeHtml(branch.id)}">${escapeHtml(branch.name)}</option>`)
    .join("");
  branchSelect.value = state.branches.some((branch) => branch.id === selectedBranch) ? selectedBranch : state.branches[0]?.id || "";

  const services = state.services.filter((service) => service.branches.includes(branchSelect.value));
  serviceSelect.innerHTML = services
    .map((service) => `<option value="${escapeHtml(service.id)}">${escapeHtml(service.name)} (${escapeHtml(service.duration)} min)</option>`)
    .join("");
  serviceSelect.value = services.some((service) => service.id === selectedService) ? selectedService : services[0]?.id || "";
}

function renderAvailability(state) {
  const startInput = document.querySelector("#availabilityStart");
  const startDate = startInput.value || todayValue();
  startInput.value = startDate;

  const branch = state.branches.find((item) => item.id === document.querySelector("#availabilityBranch").value);
  const service = state.services.find((item) => item.id === document.querySelector("#availabilityService").value);
  const days = Array.from({ length: 30 }, (_, index) => todayValue(index + dayOffset(startDate)));

  let openDays = 0;
  let bestDay = null;
  let nextSlot = null;

  const cards = days.map((dateValue) => {
    const dayBookings = state.bookings.filter((booking) => booking.branchId === branch?.id && booking.date === dateValue && activeBooking(booking));
    const hours = branch?.opening?.[dayKey(dateValue)];

    if (!hours) {
      return availabilityCard(dateValue, "closed", "Closed", dayBookings.length, "No branch hours set for this day.", []);
    }

    const slots = availableStarts(state, branch, service, dateValue);
    if (branch.bookingMode === "walk-ins") {
      if (slots.length) {
        openDays += 1;
        if (!nextSlot) nextSlot = `${shortDate(dateValue)} ${slots[0]}`;
      }
      return availabilityCard(dateValue, "walkins", "Walk-ins", dayBookings.length, slots.length ? "Open for walk-ins and last-minute clients." : "Walk-in day has no remaining open hours.", slots.slice(0, 4));
    }

    if (slots.length) {
      openDays += 1;
      if (!nextSlot) nextSlot = `${shortDate(dateValue)} ${slots[0]}`;
      if (!bestDay || slots.length > bestDay.slots) bestDay = { dateValue, slots: slots.length };
    }

    const mood = slots.length === 0 ? "full" : slots.length <= 2 ? "tight" : "open";
    const label = slots.length === 0 ? "Full" : slots.length <= 2 ? "Almost full" : dayBookings.length ? "Space open" : "Free day";
    const details = slots.length === 0 ? "No appointment starts available." : `${slots.length} appointment starts open.`;
    return availabilityCard(dateValue, mood, label, dayBookings.length, details, slots.slice(0, 4));
  });

  document.querySelector("#availabilityOpenDays").textContent = openDays;
  document.querySelector("#availabilityBestDay").textContent = bestDay ? `${shortDate(bestDay.dateValue)} (${bestDay.slots})` : branch?.bookingMode === "walk-ins" ? "Walk-ins only" : "-";
  document.querySelector("#availabilityNextSlot").textContent = nextSlot || "-";
  document.querySelector("#availabilityRows").innerHTML = cards.join("");
}

function dayOffset(dateValue) {
  const today = new Date(`${todayValue()}T00:00:00`);
  const start = new Date(`${dateValue}T00:00:00`);
  return Math.round((start - today) / 86400000);
}

function availabilityCard(dateValue, mood, label, bookedCount, details, slots) {
  const slotChips = slots.length
    ? `<div class="availability-slots">${slots.map((slot) => `<span>${escapeHtml(slot)}</span>`).join("")}</div>`
    : `<div class="availability-slots"><span>No slots</span></div>`;
  return `
    <article class="availability-day ${escapeHtml(mood)}">
      <div class="availability-date">
        <div>${escapeHtml(shortDate(dateValue))}</div>
        <span>${escapeHtml(label)}</span>
      </div>
      <div>
        <strong>${escapeHtml(bookedCount)}</strong>
        <p>${bookedCount === 1 ? "active booking" : "active bookings"}</p>
      </div>
      <p>${escapeHtml(details)}</p>
      ${slotChips}
    </article>
  `;
}

function renderCalendarFilters(state) {
  const branchSelect = document.querySelector("#calendarBranch");
  const selectedBranch = branchSelect.value || "all";
  branchSelect.innerHTML = [
    `<option value="all">All branches</option>`,
    ...state.branches.map((branch) => `<option value="${escapeHtml(branch.id)}">${escapeHtml(branch.name)}</option>`)
  ].join("");
  branchSelect.value = [...branchSelect.options].some((option) => option.value === selectedBranch) ? selectedBranch : "all";
}

function renderCalendar(state) {
  const dateInput = document.querySelector("#calendarDate");
  const branchFilter = document.querySelector("#calendarBranch").value || "all";
  const statusFilter = document.querySelector("#calendarStatus").value || "active";
  const selectedDate = dateInput.value || todayValue();
  dateInput.value = selectedDate;

  const bookings = state.bookings
    .filter((booking) => booking.date === selectedDate)
    .filter((booking) => branchFilter === "all" || booking.branchId === branchFilter)
    .filter((booking) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return activeStatuses.includes(booking.status);
      return booking.status === statusFilter;
    })
    .sort((a, b) => minutes(a.time) - minutes(b.time));

  document.querySelector("#calendarDayLabel").textContent = formatLongDate(selectedDate);
  document.querySelector("#calendarBookingCount").textContent = bookings.length;
  document.querySelector("#calendarConfirmedCount").textContent = bookings.filter((booking) => booking.status === "confirmed").length;
  document.querySelector("#calendarRevenue").textContent = currency(
    bookings
      .filter((booking) => !["cancelled", "rejected"].includes(booking.status))
      .reduce((sum, booking) => sum + Number(booking.total || 0), 0)
  );

  const rows = document.querySelector("#calendarRows");
  if (bookings.length === 0) {
    rows.innerHTML = `<div class="calendar-empty">No bookings for this date and filter yet.</div>`;
    return;
  }

  rows.innerHTML = bookings
    .map((booking) => `
      <article class="calendar-booking">
        <div class="calendar-time">${escapeHtml(booking.time)} - ${escapeHtml(addMinutes(booking.time, booking.duration))}</div>
        <div>
          <h3>${escapeHtml(booking.client?.name)} - ${escapeHtml(booking.serviceName)}</h3>
          <p>${escapeHtml(booking.branchName)} | Ref ${escapeHtml(booking.reference)} | ${escapeHtml(booking.client?.phone || booking.client?.whatsapp || "")}</p>
          <p>Paid now: ${currency(booking.amountDue)} | Balance: ${currency(booking.balance)}</p>
          ${renderClientLinks(booking)}
        </div>
        <span class="status ${escapeHtml(booking.status)}">${escapeHtml(statusLabel(booking.status))}</span>
      </article>
    `)
    .join("");
}

function updateBooking(id, status) {
  const state = loadState();
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return;
  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  saveState(state);
  render();
  showMessage(`Booking ${booking.reference} updated to ${status.replace("_", " ")}.`);
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
          <h3>${escapeHtml(booking.client.name)} - ${escapeHtml(booking.serviceName)}</h3>
          <p>${escapeHtml(booking.branchName)} | ${escapeHtml(booking.date)} at ${escapeHtml(booking.time)} | Ref ${escapeHtml(booking.reference)}</p>
          <p>Paid now: ${currency(booking.amountDue)} | Balance: ${currency(booking.balance)}</p>
          ${renderClientLinks(booking)}
          ${renderProofLinks(booking)}
          <span class="status ${escapeHtml(booking.status)}">${escapeHtml(statusLabel(booking.status))}</span>
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
    .map((proof) => `<a href="${escapeHtml(proof.dataUrl)}" target="_blank" rel="noreferrer">${escapeHtml(proof.name)}</a>`)
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
          <h3>${escapeHtml(service.name)}</h3>
          <p>${escapeHtml(service.category)} | ${currency(service.specialPrice || service.price)} | ${escapeHtml(service.duration)} min | ${service.depositType === "full" ? "Full payment" : "50% deposit"}</p>
          <p>${escapeHtml(service.branches.join(", "))}</p>
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
          <h3>${escapeHtml(branch.name)}</h3>
          <p>${escapeHtml(branch.address)}</p>
          <p>${escapeHtml(branch.policy)}</p>
          <span class="status">${branch.bookingMode === "walk-ins" ? "Walk-ins only" : "Appointments"}</span>
        </div>
      </article>
    `)
    .join("");
}

function renderQuickBookingFields(state) {
  const branchSelect = document.querySelector("#quickBranch");
  const serviceSelect = document.querySelector("#quickService");
  const selectedBranch = branchSelect.value || state.branches[0]?.id || "";
  const selectedService = serviceSelect.value;

  branchSelect.innerHTML = state.branches
    .map((branch) => `<option value="${escapeHtml(branch.id)}">${escapeHtml(branch.name)}</option>`)
    .join("");
  branchSelect.value = state.branches.some((branch) => branch.id === selectedBranch) ? selectedBranch : state.branches[0]?.id || "";

  const services = state.services.filter((service) => service.branches.includes(branchSelect.value));
  serviceSelect.innerHTML = services
    .map((service) => `<option value="${escapeHtml(service.id)}">${escapeHtml(service.name)}</option>`)
    .join("");
  serviceSelect.value = services.some((service) => service.id === selectedService) ? selectedService : services[0]?.id || "";
  renderQuickTimes(state);
}

function renderQuickTimes(state) {
  const branch = state.branches.find((item) => item.id === document.querySelector("#quickBranch").value);
  const service = state.services.find((item) => item.id === document.querySelector("#quickService").value);
  const dateValue = document.querySelector("#quickDate").value || todayValue();
  document.querySelector("#quickDate").value = dateValue;

  const timeSelect = document.querySelector("#quickTime");
  const slots = availableStarts(state, branch, service, dateValue);
  if (!slots.length) {
    timeSelect.innerHTML = `<option value="">No open slots</option>`;
    return;
  }

  const prefix = branch?.bookingMode === "walk-ins" ? "Walk-in" : "Available";
  timeSelect.innerHTML = slots.map((slot) => `<option value="${escapeHtml(slot)}">${prefix} ${escapeHtml(slot)}</option>`).join("");
}

function render() {
  const state = loadState();
  renderStats(state);
  renderBusinessSettings(state);
  renderAvailabilityFilters(state);
  renderAvailability(state);
  renderCalendarFilters(state);
  renderCalendar(state);
  renderQuickBookingFields(state);
  renderBookings(state);
  renderServices(state);
  renderBranches(state);
}

document.querySelector("#businessForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const state = loadState();
  state.business = {
    ...state.business,
    bannerNotice: document.querySelector("#bannerNoticeInput").value.trim(),
    cashNotice: document.querySelector("#cashNoticeInput").value.trim(),
    depositPercentage: Number(document.querySelector("#depositPercentageInput").value),
    paymentWindowMinutes: Number(document.querySelector("#paymentWindowInput").value),
    bank: {
      ...state.business.bank,
      name: document.querySelector("#bankNameInput").value.trim(),
      accountHolder: document.querySelector("#bankHolderInput").value.trim(),
      accountNumber: document.querySelector("#bankAccountInput").value.trim(),
      linkedMobile: document.querySelector("#bankMobileInput").value.trim()
    }
  };
  saveState(state);
  render();
  showMessage("Business settings saved. The public website will use these details.");
});

document.querySelector("#serviceForm").addEventListener("submit", (event) => {
  event.preventDefault();
  saveService(event.target);
});

document.querySelector("#quickBookingForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const state = loadState();
  const branch = state.branches.find((item) => item.id === document.querySelector("#quickBranch").value);
  const service = state.services.find((item) => item.id === document.querySelector("#quickService").value);
  const time = document.querySelector("#quickTime").value;
  if (!branch || !service || !time) {
    showMessage("Choose a branch, service, date, and open time before adding a booking.");
    return;
  }

  const paymentMode = document.querySelector("#quickPayment").value;
  const total = servicePrice(service, branch.id);
  const amountDue =
    paymentMode === "full"
      ? total
      : paymentMode === "none"
        ? 0
        : service.depositType === "full"
          ? total
          : Math.ceil(total * (Number(state.business.depositPercentage || 50) / 100));
  const clientName = document.querySelector("#quickClientName").value.trim();

  state.bookings.push({
    id: crypto.randomUUID(),
    reference: referenceFor(clientName),
    status: document.querySelector("#quickStatus").value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "admin",
    branchId: branch.id,
    branchName: branch.name,
    serviceId: service.id,
    serviceName: service.name,
    duration: service.duration,
    total,
    amountDue,
    balance: total - amountDue,
    date: document.querySelector("#quickDate").value,
    time,
    client: {
      name: clientName,
      phone: document.querySelector("#quickClientPhone").value.trim(),
      whatsapp: document.querySelector("#quickClientPhone").value.trim(),
      email: ""
    },
    notes: document.querySelector("#quickNotes").value.trim(),
    proofFiles: []
  });

  saveState(state);
  event.target.reset();
  document.querySelector("#quickDate").value = todayValue();
  render();
  showMessage("Booking added to the calendar and payment review list.");
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
    image: imageFile ? await fileToDataUrl(imageFile) : existing?.image || "assets/banner-image.jpeg",
    tags: existing?.tags || []
  };
  const index = state.services.findIndex((item) => item.id === id);
  if (index >= 0) state.services[index] = service;
  else state.services.push(service);
  saveState(state);
  form.reset();
  document.querySelector("#serviceId").value = "";
  render();
  showMessage("Service saved. Prices, specials, and images are updated.");
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

document.querySelector("#availabilityStart").value = todayValue();
document.querySelector("#availabilityStart").addEventListener("change", () => render());
document.querySelector("#availabilityBranch").addEventListener("change", () => render());
document.querySelector("#availabilityService").addEventListener("change", () => render());
document.querySelector("#calendarDate").value = todayValue();
document.querySelector("#calendarDate").addEventListener("change", () => render());
document.querySelector("#calendarBranch").addEventListener("change", () => render());
document.querySelector("#calendarStatus").addEventListener("change", () => render());
document.querySelector("#quickDate").value = todayValue();
document.querySelector("#quickBranch").addEventListener("change", () => render());
document.querySelector("#quickService").addEventListener("change", () => renderQuickTimes(loadState()));
document.querySelector("#quickDate").addEventListener("change", () => renderQuickTimes(loadState()));
document.querySelectorAll("[data-calendar-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#calendarDate").value = todayValue(Number(button.dataset.calendarJump || 0));
    render();
  });
});

render();
hydrateState();
