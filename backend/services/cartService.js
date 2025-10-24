// Place file at: backend/services/cartService.js
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

/**
 * Return cart for user in consistent shape: { items: [...], total: number }
 */
async function getCartForUser(userId) {
  const items = await cartRepo.getCartWithItems(userId); // repo returns array of rows
  const computedItems = Array.isArray(items) ? items : [];
  const total = computedItems.reduce((s, it) => {
    const unit = Number(it.Price ?? it.price ?? 0);
    const qty = Number(it.Qty ?? it.qty ?? 1);
    return s + unit * qty;
  }, 0);
  return { items: computedItems, total };
}

async function removeCartItem(userId, cartItemId) {
  // validate ownership & delete (repo enforces ownership by join with Carts)
  const result = await cartRepo.deleteCartItem(userId, cartItemId);
  // Optionally check affected rows, but repo returns the query result. If you want to throw on 0 rows:
  if (result && typeof result.rowsAffected !== 'undefined') {
    const totalDeleted = Array.isArray(result.rowsAffected) ? result.rowsAffected.reduce((a,b)=>a+b,0) : (result.rowsAffected || 0);
    if (totalDeleted === 0) {
      const e = new Error('Cart item not found or not owned by user');
      e.status = 404;
      throw e;
    }
  }
  return;
}

module.exports = { addToCart, getCartForUser, removeCartItem };
