import type { Config } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { notifyAdminBookingSubmitted } from "./_shared/booking-notifications.mts";
import { getState, setState } from "./_shared/state-store.mts";

const ACTIVE_STATUSES = ["awaiting_payment", "needs_review", "confirmed"];

type AnyRecord = Record<string, any>;

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function minutes(time: string) {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  return hour * 60 + minute;
}

function dayKey(dateValue: string) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(`${dateValue}T00:00:00`).getDay()];
}

function isPastSlot(dateValue: string, time: string) {
  return new Date(`${dateValue}T${time}:00+02:00`).getTime() <= Date.now();
}

function servicePrice(service: AnyRecord, branchId: string) {
  if (branchId === "midrand" && service?.midrandPrice) return service.midrandPrice;
  if (service?.specialPrice) return service.specialPrice;
  return service?.price || 0;
}

function isSlotAvailable(state: AnyRecord, branch: AnyRecord, service: AnyRecord, date: string, time: string) {
  const hours = branch.opening?.[dayKey(date)];
  if (!hours || branch.bookingMode === "walk-ins") return false;

  const start = minutes(time);
  const end = start + Number(service.duration || 30);
  const [open, close] = hours.map(minutes);
  if (start < open || end > close) return false;

  return !state.bookings.some((booking: AnyRecord) => {
    if (booking.branchId !== branch.id || booking.date !== date || !ACTIVE_STATUSES.includes(booking.status)) return false;
    const existingStart = minutes(booking.time);
    const existingEnd = existingStart + Number(booking.duration || 30);
    return start < existingEnd && end > existingStart;
  });
}

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const submitted = await req.json().catch(() => ({}));
  const state = await getState() as AnyRecord;
  state.bookings ||= [];

  const branch = state.branches?.find((item: AnyRecord) => item.id === submitted.branchId);
  const service = state.services?.find((item: AnyRecord) => item.id === submitted.serviceId);
  if (!branch || !service || !service.branches?.includes(branch.id)) {
    return json({ error: "Selected branch or service is not available." }, 400);
  }

  if (submitted.date && submitted.time && isPastSlot(submitted.date, submitted.time)) {
    return json({ error: "Please choose a future appointment time." }, 400);
  }

  if (!submitted.date || !submitted.time || !isSlotAvailable(state, branch, service, submitted.date, submitted.time)) {
    return json({ error: "That appointment slot is no longer available." }, 409);
  }

  const total = servicePrice(service, branch.id);
  const paymentOption = submitted.paymentOption === "full" || service.depositType === "full" ? "full" : "deposit";
  const amountDue = paymentOption === "full" ? total : Math.ceil(total * (Number(state.business?.depositPercentage || 50) / 100));
  const reference = String(submitted.reference || `AEK-${Date.now().toString().slice(-6)}`).slice(0, 40);

  const booking = {
    id: randomUUID(),
    reference,
    status: "awaiting_payment",
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + Number(state.business?.paymentWindowMinutes || 15) * 60000,
    branchId: branch.id,
    branchName: branch.name,
    serviceId: service.id,
    serviceName: service.name,
    duration: Number(service.duration || 30),
    total,
    amountDue,
    balance: total - amountDue,
    date: submitted.date,
    time: submitted.time,
    paymentOption,
    client: {
      name: String(submitted.client?.name || "").trim(),
      phone: String(submitted.client?.phone || "").trim(),
      whatsapp: String(submitted.client?.whatsapp || submitted.client?.phone || "").trim(),
      email: String(submitted.client?.email || "").trim()
    },
    notes: String(submitted.notes || "").trim(),
    laceType: String(submitted.laceType || "").trim(),
    plucking: String(submitted.plucking || "").trim(),
    proofFiles: [],
    notifications: {
      adminNotifiedAt: null,
      confirmationSentAt: null,
      reminderSentAt: null
    }
  };

  state.bookings.push(booking);
  await setState(state);
  await notifyAdminBookingSubmitted(booking);

  return json({ ok: true, booking });
};

export const config: Config = {
  path: "/api/bookings",
  method: "POST"
};
