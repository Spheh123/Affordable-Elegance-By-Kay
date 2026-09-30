import type { Config } from "@netlify/functions";
import { authError, isAdminRequest } from "./_shared/admin-auth.mts";
import { confirmationMessage } from "./_shared/messages.mts";
import { getState, setState } from "./_shared/state-store.mts";
import { sendWhatsAppMessage } from "./_shared/whatsapp.mts";

type AnyRecord = Record<string, any>;

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAdminRequest(req)) return authError();

  const { bookingId } = await req.json().catch(() => ({}));
  const state = await getState() as AnyRecord;
  const booking = state.bookings?.find((item: AnyRecord) => item.id === bookingId);
  if (!booking) return json({ error: "Booking not found." }, 404);

  const body = confirmationMessage(booking, state);
  const sent = await sendWhatsAppMessage(booking.client?.whatsapp || booking.client?.phone || "", body);
  if (!sent.ok && sent.status === 503) {
    return json({
      error: "WhatsApp automation is not connected yet.",
      manualMessage: body
    }, 503);
  }
  if (!sent.ok) return json({ error: sent.error, details: sent.details }, sent.status);

  booking.notifications ||= {};
  booking.notifications.confirmationSentAt = new Date().toISOString();
  booking.notifications.confirmationProvider = "twilio";
  booking.notifications.confirmationSid = sent.sid;
  await setState(state);

  return json({ ok: true, sid: sent.sid });
};

export const config: Config = {
  path: "/api/send-whatsapp",
  method: "POST"
};
