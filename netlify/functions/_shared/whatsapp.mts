import { whatsappDigits } from "./messages.mts";

export function hasWhatsAppProvider() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

export async function sendWhatsAppMessage(toValue: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) {
    return { ok: false, status: 503, error: "WhatsApp automation is not connected yet." };
  }

  const to = whatsappDigits(toValue);
  if (!to) return { ok: false, status: 400, error: "WhatsApp number is missing." };

  const form = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: `whatsapp:+${to}`,
    Body: body
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: response.status, error: result.message || "WhatsApp send failed.", details: result };
  }

  return { ok: true, sid: result.sid };
}
