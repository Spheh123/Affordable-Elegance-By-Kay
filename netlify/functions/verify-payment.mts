import type { Config } from "@netlify/functions";
import OpenAI from "openai";
import { getState, setState } from "./_shared/state-store.mts";

type Booking = {
  id?: string;
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

  const proofFiles = await Promise.all(files.map(async (file) => ({
    name: file.name,
    type: file.type,
    dataUrl: `data:${file.type || "application/octet-stream"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`
  })));

  const firstFile = files[0];
  let result = {
    status: "needs_review",
    confidence: 0,
    reason: "Proof received. Admin review is required."
  };

  if (firstFile.type === "application/pdf") {
    result = {
      status: "needs_review",
      confidence: 55,
      reason: "PDF proof was received. Manual review is required until PDF extraction is enabled."
    };
  } else if (process.env.OPENAI_API_KEY) {
    try {
      const base64 = proofFiles[0].dataUrl.split(",")[1] || "";
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
      const parsed = JSON.parse(content);
      result = {
        status: parsed.status === "approved" && Number(parsed.confidence) >= 95 ? "approved" : "needs_review",
        confidence: Number(parsed.confidence || 0),
        reason: String(parsed.reason || "Verification completed.")
      };
    } catch {
      result = {
        status: "needs_review",
        confidence: 0,
        reason: "Proof received. Automatic verification was unavailable, so admin review is required."
      };
    }
  }

  const state = await getState() as any;
  const saved = state.bookings?.find((item: any) => item.id === booking.id || item.reference === booking.reference);
  if (saved) {
    saved.status = result.status === "approved" ? "confirmed" : "needs_review";
    saved.aiResult = result;
    saved.proofFiles = proofFiles;
    saved.updatedAt = new Date().toISOString();
    await setState(state);
  }

  return json({ ...result, booking: saved || null });
};

export const config: Config = {
  path: "/api/verify-payment",
  method: "POST"
};
