import type { Config } from "@netlify/functions";
import { reminderMessage } from "./_shared/messages.mts";
import { getState, setState } from "./_shared/state-store.mts";
import { hasWhatsAppProvider, sendWhatsAppMessage } from "./_shared/whatsapp.mts";

type AnyRecord = Record<string, any>;

function johannesburgDate(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function johannesburgHour() {
  return Number(new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    hour12: false
  }).format(new Date()));
}

export default async () => {
  const reminderHour = Number(process.env.REMINDER_HOUR_SAST || 8);
  if (johannesburgHour() !== reminderHour) {
    return Response.json({ ok: true, skipped: "outside_reminder_hour" });
  }

  if (!hasWhatsAppProvider()) {
    return Response.json({ ok: true, skipped: "whatsapp_not_connected" });
  }

  const state = await getState() as AnyRecord;
  const tomorrow = johannesburgDate(1);
  const dueBookings = (state.bookings || []).filter((booking: AnyRecord) =>
    booking.status === "confirmed" &&
    booking.date === tomorrow &&
    !booking.notifications?.reminderSentAt
  );

  const results = await Promise.allSettled(dueBookings.map(async (booking: AnyRecord) => {
    const sent = await sendWhatsAppMessage(
      booking.client?.whatsapp || booking.client?.phone || "",
      reminderMessage(booking, state)
    );
    if (!sent.ok) throw new Error(sent.error);

    booking.notifications ||= {};
    booking.notifications.reminderSentAt = new Date().toISOString();
    booking.notifications.reminderProvider = "twilio";
    booking.notifications.reminderSid = sent.sid;
    return sent.sid;
  }));

  if (dueBookings.length) await setState(state);

  return Response.json({
    ok: true,
    date: tomorrow,
    attempted: dueBookings.length,
    sent: results.filter((result) => result.status === "fulfilled").length
  });
};

export const config: Config = {
  schedule: "@hourly"
};
