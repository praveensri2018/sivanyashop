// backend/pages/api/prices/effective.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { resolveEffectivePrice } from "../../../lib/price-resolver";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const variantId = Number(req.query.variantId);
  const customerId = req.query.customerId ? Number(req.query.customerId) : null;
  if (!variantId) return res.status(400).json({ error: "variantId_required" });
  try {
    const p = await resolveEffectivePrice({ customerId, variantId });
    res.json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "price_error" });
  }
}
