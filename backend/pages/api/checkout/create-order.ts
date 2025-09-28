// backend/pages/api/checkout/create-order.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../middleware/auth";
import { createOrderFromCart } from "../../../lib/checkout";

async function handler(req: any, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const userId = req.user.userId;
  const { shippingAddressId } = req.body;
  try {
    const result = await createOrderFromCart(userId, shippingAddressId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "checkout_error" });
  }
}

export default requireAuth(handler);
