// Place file at: backend/services/paymentService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const orderService = require('./orderService');

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.warn('Razorpay keys not set in env (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
}

const razorpay = new Razorpay({
  key_id,
  key_secret
});

async function createOrder({ amountInRupees, currency = 'INR', receipt = null, notes = {} }) {
  // Razorpay expects amount in paise (integer)
  const amount = Math.round(Number(amountInRupees) * 100);
  const options = {
    amount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes
  };
  const order = await razorpay.orders.create(options);
  return order; // contains order.id, amount, currency, etc.
}

/**
 * Validate payment signature from frontend (after checkout)
 * frontend will send: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns boolean
 */
function verifyPaymentSignature({ order_id, payment_id, signature }) {
  // expected signature = hmac_sha256(order_id + '|' + payment_id, key_secret)
  const hmac = crypto.createHmac('sha256', key_secret);
  hmac.update(`${order_id}|${payment_id}`);
  const expected = hmac.digest('hex');
  return expected === signature;
}

/**
 * Verify webhook signature
 * webhookSecret comes from dashboard; requestBody must be raw string (not parsed JSON)
 */
function verifyWebhookSignature(rawBody, signature, webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!webhookSecret) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return expected === signature;
}



async function createOrderFromCart({ userId, retailerId, shippingAddressId, cartItems, paymentGatewayOrderId, paymentGatewayPaymentId }) {
  // Calculate total amount from cart items
  const totalAmount = cartItems.reduce((total, item) => {
    return total + (Number(item.Price || item.price || 0) * Number(item.Qty || item.qty || 1));
  }, 0);

  console.log('💵 Creating order with total:', totalAmount);

  // Create order - MAKE SURE THIS RETURNS THE CREATED ORDER
  const order = await orderRepo.createOrder({
    userId: userId,
    retailerId: retailerId || null,
    shippingAddressId: shippingAddressId || null,
    totalAmount: totalAmount,
    status: 'CONFIRMED',
    paymentStatus: 'PAID'
  });

  console.log('📦 Order created in DB:', order);

  if (!order || !order.Id) {
    throw new Error('Order repository did not return order with Id');
  }

  // Add order items
  for (const item of cartItems) {
    await orderRepo.createOrderItem({
      orderId: order.Id,
      productId: item.ProductId || item.productId,
      variantId: item.VariantId || item.variantId,
      qty: item.Qty || item.qty,
      price: item.Price || item.price
    });
  }

  console.log('✅ Order items created for order ID:', order.Id);

  return order;
}

/**
 * Complete order after successful payment
 */
// In services/paymentService.js
async function completeOrderAfterPayment({ razorpay_order_id, razorpay_payment_id, userId, cartItems, shippingAddressId, retailerId }) {
  try {
    console.log('🔄 Starting order creation in completeOrderAfterPayment');
    
    // Calculate total amount
    const totalAmount = cartItems.reduce((total, item) => {
      const price = item.Price || item.price || 0;
      const qty = item.Qty || item.qty || 1;
      return total + (Number(price) * Number(qty));
    }, 0);

    console.log('💰 Total amount calculated:', totalAmount);

    // Create order - MAKE SURE THIS RETURNS AN ORDER WITH Id PROPERTY
    const order = await orderService.createOrderFromCart({
      userId,
      retailerId,
      shippingAddressId,
      cartItems,
      paymentGatewayOrderId: razorpay_order_id,
      paymentGatewayPaymentId: razorpay_payment_id
    });

    console.log('✅ Order created:', order);
    console.log('✅ Order ID:', order.Id); // Check if this exists

    if (!order || !order.Id) {
      throw new Error('Order creation failed - no order ID returned');
    }

    // Create payment record
    const payment = await orderService.createPaymentRecord({
      orderId: order.Id,
      amount: totalAmount,
      method: 'RAZORPAY',
      paymentGateway: 'razorpay',
      transactionRef: razorpay_payment_id,
      status: 'PAID'
    });

    console.log('✅ Payment created:', payment);

    // Update stock
    await orderService.updateStockForOrder(order.Id);

    // Clear user cart
    await orderService.clearUserCart(userId);

    return { order, payment };
  } catch (error) {
    console.error('❌ Error in completeOrderAfterPayment:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment({ razorpay_order_id, razorpay_payment_id, userId }) {
  try {
    // Create order with failed status
    const order = await orderService.createFailedOrder({
      userId,
      paymentGatewayOrderId: razorpay_order_id,
      paymentGatewayPaymentId: razorpay_payment_id,
      status: 'FAILED',
      paymentStatus: 'FAILED'
    });

    // Create failed payment record
    const payment = await orderService.createPaymentRecord({
      orderId: order.Id,
      amount: 0, // or the intended amount
      method: 'RAZORPAY',
      paymentGateway: 'razorpay',
      transactionRef: razorpay_payment_id,
      status: 'FAILED'
    });

    return { order, payment };
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

module.exports = { razorpay, createOrder, verifyPaymentSignature, verifyWebhookSignature,  completeOrderAfterPayment,
  handleFailedPayment,createOrderFromCart };
