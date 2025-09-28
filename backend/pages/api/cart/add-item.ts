// backend/pages/api/cart/add-item.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../middleware/auth";
import { getOrCreateCart, addItem, listCartItems } from "../../../lib/cart";
import { resolveEffectivePrice } from "../../../lib/price-resolver";

async function handler(req: any, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const userId = req.user.userId;
  const { productId, variantId, qty } = req.body;
  if (!productId || !variantId || !qty) return res.status(400).json({ error: "bad_request" });

  // resolve price
  const priceObj = await resolveEffectivePrice({ customerId: userId, variantId: Number(variantId) });
  const cart = await getOrCreateCart(userId);
  await addItem(cart.Id, productId, variantId, qty, priceObj.unitPrice);
  const items = await listCartItems(cart.Id);
  res.json({ cartId: cart.Id, items });
}

export default requireAuth(handler);
