// backend/pages/api/checkout/payment-webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { isEventProcessed, markEventProcessed } from "../../../utils/idempotency";
import { handlePaymentSuccess } from "../../../lib/settlement";

export const config = { api: { bodyParser: false } }; // important to read raw body

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const raw = await buffer(req);
  const text = raw.toString("utf8");

  // parse event - this depends on provider; here we expect JSON with id and type
  let evt;
  try {
    evt = JSON.parse(text);
  } catch (err) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  const eventId = evt.id || evt.eventId;
  if (!eventId) return res.status(400).json({ error: "missing_event_id" });

  if (await isEventProcessed(eventId)) {
    return res.status(200).json({ received: true });
  }

  try {
    // Example: if payment succeeded
    if (evt.type === "payment.succeeded" || evt.type === "checkout.session.completed") {
      const orderId = evt.data?.object?.metadata?.orderId || evt.data?.object?.orderId;
      if (orderId) await handlePaymentSuccess(Number(orderId), evt);
    }
    await markEventProcessed(eventId);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "webhook_processing_error" });
  }
}
