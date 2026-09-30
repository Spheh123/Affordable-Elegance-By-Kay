import { sendWhatsAppMessage } from "./whatsapp.mts";

type Booking = {
  reference: string;
  branchName: string;
  serviceName: string;
  date: string;
  time: string;
  amountDue?: number;
  client?: {
    name?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
};

function money(value: number | undefined) {
  return `R${Number(value || 0).toLocaleString("en-ZA")}`;
}

export async function notifyAdminBookingSubmitted(booking: Booking) {
  const webhookUrl = process.env.BOOKING_NOTIFICATION_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const adminWhatsApp = process.env.ADMIN_WHATSAPP_TO;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || "Affordable Elegance <onboarding@resend.dev>";

  const text = [
    "New Affordable Elegance by Kay booking needs attention.",
    "",
    `Client: ${booking.client?.name || "Unknown"}`,
    `Phone: ${booking.client?.phone || booking.client?.whatsapp || "Not supplied"}`,
    `Service: ${booking.serviceName}`,
    `Branch: ${booking.branchName}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    `Pay now: ${money(booking.amountDue)}`,
    `Reference: ${booking.reference}`,
    "",
    "Open the admin portal to approve, review payment proof, or contact the client."
  ].join("\n");

  await Promise.allSettled([
    webhookUrl
      ? fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "booking.submitted", booking })
        })
      : Promise.resolve(),
    resendKey && adminEmail
      ? fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [adminEmail],
            subject: `New booking: ${booking.client?.name || booking.reference}`,
            text
          })
        })
      : Promise.resolve(),
    adminWhatsApp
      ? sendWhatsAppMessage(adminWhatsApp, text)
      : Promise.resolve()
  ]);
}
