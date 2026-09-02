import type { Config } from "@netlify/functions";
import OpenAI from "openai";

type Booking = {
  reference: string;
  amountDue: number;
  total: number;
  balance: number;
  date: string;
  time: string;
  client: { name: string };
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const form = await req.formData();
  const booking = JSON.parse(String(form.get("booking") || "{}")) as Booking;
  const files = form.getAll("proof").filter((file): file is File => file instanceof File).slice(0, 2);

  if (!booking.reference || files.length === 0) {
    return json({ status: "needs_review", confidence: 0, reason: "Missing booking reference or proof file." }, 400);
  }

  const firstFile = files[0];
  if (firstFile.type === "application/pdf") {
    return json({
      status: "needs_review",
      confidence: 55,
      reason: "PDF proof was received. Manual review is required until PDF extraction is enabled."
    });
  }

  const base64 = Buffer.from(await firstFile.arrayBuffer()).toString("base64");
  const openai = new OpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You verify South African EFT or Capitec proof of payment screenshots for a salon. Return JSON only with status approved or needs_review, confidence 0-100, and reason. Approve only when amount, recipient/account, date proximity, and payment reference clearly match."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Expected recipient: Mrs PK Bisaso, Capitec Bank, account 1726218692 or linked mobile 0824950500. Expected amount paid now: R${booking.amountDue}. Booking reference: ${booking.reference}. Client: ${booking.client?.name}. Appointment: ${booking.date} ${booking.time}.`
          },
          {
            type: "image_url",
            image_url: { url: `data:${firstFile.type};base64,${base64}` }
          }
        ]
      }
    ]
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const result = JSON.parse(content);
  return json({
    status: result.status === "approved" && Number(result.confidence) >= 95 ? "approved" : "needs_review",
    confidence: Number(result.confidence || 0),
    reason: String(result.reason || "Verification completed.")
  });
};

export const config: Config = {
  path: "/api/verify-payment",
  method: "POST"
};
