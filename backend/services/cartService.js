const cartRepo = require('../repositories/cartRepo');
const productRepo = require('../repositories/productRepo'); // to look up price if needed

/**
 * Add to cart:
 * - Ensures a Cart exists for user
 * - If an item with same product+variant exists, increments qty and updates Price to latest provided
 * - Stores Price (unit price) at the time of adding (per your schema)
 */
async function addToCart({ userId, productId, variantId = null, qty = 1, price = null }) {
  // ensure cart exists
  let cart = await cartRepo.getCartByUserId(userId);
  if (!cart) cart = await cartRepo.createCartForUser(userId);

  // If price not provided, attempt to fetch latest price for variant (customer price)
  let unitPrice = price;
  if (unitPrice == null) {
    // prefer price from VariantPrices (customer)
    const p = await productRepo.getVariantLatestPrice(variantId || null, 'CUSTOMER');
    unitPrice = p != null ? Number(p) : null;
  }

  const existing = await cartRepo.findCartItem(cart.Id, productId, variantId);
  if (existing) {
    const newQty = Number(existing.Qty || 0) + Number(qty || 0);
    await cartRepo.updateCartItemQty(existing.Id, newQty, unitPrice);
    return { id: existing.Id, cartId: cart.Id, productId, variantId, qty: newQty, price: unitPrice };
  }

  const newItem = await cartRepo.insertCartItem(cart.Id, productId, variantId, qty, unitPrice);
  return newItem;
}

async function getCartForUser(userId) {
  const cart = await cartRepo.getCartWithItems(userId);
  return cart;
}

async function removeCartItem(userId, cartItemId) {
  // validate ownership
  await cartRepo.deleteCartItem(userId, cartItemId);
}

module.exports = { addToCart, getCartForUser, removeCartItem };
