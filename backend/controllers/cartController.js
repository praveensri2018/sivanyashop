// Place file at: backend/controllers/cartController.js
const cartService = require('../services/cartService');

async function addToCart(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { productId, variantId = null, qty = 1, price = null } = req.body;
    if (!productId || !qty) return res.status(400).json({ success: false, message: 'productId and qty required' });

    const item = await cartService.addToCart({
      userId: Number(user.id),
      productId: Number(productId),
      variantId: variantId == null ? null : Number(variantId),
      qty: Number(qty),
      price: price == null ? null : Number(price)
    });

    // Return updated cart (items + total) so frontend can update state immediately
    const cart = await cartService.getCartForUser(Number(user.id));
    return res.json({ success: true, cartItem: item, items: cart.items, total: cart.total });
  } catch (err) { next(err); }
}

async function getCart(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const cart = await cartService.getCartForUser(Number(user.id));
    return res.json({ success: true, items: cart.items, total: cart.total });
  } catch (err) { next(err); }
}

async function removeFromCart(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid cart item id' });

    await cartService.removeCartItem(Number(user.id), id);

    // Return updated cart so frontend can set items + total
    const cart = await cartService.getCartForUser(Number(user.id));
    return res.json({ success: true, items: cart.items, total: cart.total });
  } catch (err) { next(err); }
}
async function updateCartItem(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid cart item id' });

    const { qty, price } = req.body;
    if (typeof qty === 'undefined' && typeof price === 'undefined') {
      return res.status(400).json({ success: false, message: 'Nothing to update (qty or price required)' });
    }

    // Call service to update (verifies ownership)
    const updatedItem = await cartService.updateCartItem(Number(user.id), id, { qty: typeof qty !== 'undefined' ? Number(qty) : undefined, price: typeof price !== 'undefined' ? Number(price) : undefined });

    // Return updated cart so frontend can set items + total
    const cart = await cartService.getCartForUser(Number(user.id));
    return res.json({ success: true, item: updatedItem, items: cart.items, total: cart.total });
  } catch (err) { next(err); }
}
module.exports = { addToCart, getCart, removeFromCart,updateCartItem };
