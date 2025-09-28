// backend/pages/api/cart/get.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../middleware/auth";
import { getOrCreateCart, listCartItems } from "../../../lib/cart";

async function handler(req: any, res: NextApiResponse) {
  const userId = req.user.userId;
  const cart = await getOrCreateCart(userId);
  const items = await listCartItems(cart.Id);
  res.json({ cart, items });
}

export default requireAuth(handler);
