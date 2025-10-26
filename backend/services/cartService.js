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
async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddressId, retailerId = null } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    // Verify payment signature
    const ok = paymentService.verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!ok) {
      // Handle failed payment
      await paymentService.handleFailedPayment({
        razorpay_order_id,
        razorpay_payment_id,
        userId: req.user.id
      });
      
      return res.status(400).json({ success: false, message: 'Signature verification failed' });
    }

    // Get user's cart items
    const cart = await cartService.getCartForUser(req.user.id);
    
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Complete order creation
    const { order, payment } = await paymentService.completeOrderAfterPayment({
      razorpay_order_id,
      razorpay_payment_id,
      userId: req.user.id,
      cartItems: cart.items,
      shippingAddressId,
      retailerId
    });

    return res.json({ 
      success: true, 
      message: 'Payment verified and order created', 
      orderId: order.Id,
      paymentId: payment.Id 
    });
  } catch (err) {
    next(err);
  }
}


async function updateCartItem(userId, cartItemId, patch) {
  const qty = typeof patch.qty !== 'undefined' ? Number(patch.qty) : undefined;
  const price = typeof patch.price !== 'undefined' ? Number(patch.price) : undefined;

  // Must supply at least one field
  if (typeof qty === 'undefined' && typeof price === 'undefined') {
    const e = new Error('Nothing to update');
    e.status = 400;
    throw e;
  }

  const updated = await cartRepo.updateCartItemQtyForUser(userId, cartItemId, qty, price);

  if (!updated) {
    const e = new Error('Cart item not found or not owned by user');
    e.status = 404;
    throw e;
  }

  return updated;
}

module.exports = { addToCart, getCartForUser, removeCartItem,verifyPayment ,updateCartItem};
