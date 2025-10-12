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

    res.json({ success: true, cartItem: item });
  } catch (err) { next(err); }
}

async function getCart(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const cart = await cartService.getCartForUser(Number(user.id));
    res.json({ success: true, items: cart });
  } catch (err) { next(err); }
}

async function removeFromCart(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid cart item id' });

    await cartService.removeCartItem(Number(user.id), id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { addToCart, getCart, removeFromCart };
