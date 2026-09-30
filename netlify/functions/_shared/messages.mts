type Branch = {
  id: string;
  name: string;
  address: string;
  policy?: string;
};

type Booking = {
  reference: string;
  branchId: string;
  branchName: string;
  serviceName: string;
  date: string;
  time: string;
  balance?: number;
  client?: {
    name?: string;
    phone?: string;
    whatsapp?: string;
  };
};

type State = {
  business?: {
    name?: string;
    phone?: string;
    whatsapp?: string;
  };
  branches?: Branch[];
};

function money(value: number | undefined) {
  return `R${Number(value || 0).toLocaleString("en-ZA")}`;
}

export function whatsappDigits(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
}

export function mapsLink(address = "") {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function confirmationMessage(booking: Booking, state: State) {
  const branch = state.branches?.find((item) => item.id === booking.branchId);
  const businessName = state.business?.name || "Affordable Elegance by Kay";
  const clientName = booking.client?.name || "beautiful";
  const address = branch?.address || booking.branchName;
  const terms = branch?.policy || "Please arrive on time. Hair must be clean, relaxed, and oil-free where applicable. Cash is not accepted.";

  return [
    `Hi ${clientName}, your ${businessName} booking is confirmed.`,
    "",
    `Service: ${booking.serviceName}`,
    `Branch: ${booking.branchName}`,
    `Address: ${address}`,
    `Location: ${mapsLink(address)}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    `Reference: ${booking.reference}`,
    booking.balance ? `Balance due at appointment: ${money(booking.balance)}` : "",
    "",
    `Reminder: ${terms}`,
    "",
    "Reply here if you need help before your appointment."
  ].filter(Boolean).join("\n");
}

export function reminderMessage(booking: Booking, state: State) {
  const branch = state.branches?.find((item) => item.id === booking.branchId);
  const businessName = state.business?.name || "Affordable Elegance by Kay";
  const address = branch?.address || booking.branchName;

  return [
    `Hi ${booking.client?.name || "beautiful"}, reminder from ${businessName}: your appointment is tomorrow.`,
    "",
    `Service: ${booking.serviceName}`,
    `Branch: ${booking.branchName}`,
    `Address: ${address}`,
    `Location: ${mapsLink(address)}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    "",
    "Please arrive on time and follow the booking preparation rules sent in your confirmation."
  ].join("\n");
}
