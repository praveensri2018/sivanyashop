// Place file at: backend/services/paymentService.js
// Payment service: Razorpay helpers + complete/failed flows.
// This file calls orderService.createOrderFromCart and orderService.createPaymentRecord.

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

/**
 * Create Razorpay order (amountInRupees: number)
 */
async function createOrder({ amountInRupees, currency = 'INR', receipt = null, notes = {} }) {
  const amount = Math.round(Number(amountInRupees) * 100); // paise
  const options = {
    amount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes
  };
  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Validate payment signature from frontend (after checkout)
 * frontend will send: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns boolean
 *
function verifyPaymentSignature({ order_id, payment_id, signature }) {
  const hmac = crypto.createHmac('sha256', key_secret);
  hmac.update(`${order_id}|${payment_id}`);
  const expected = hmac.digest('hex');
  return expected === signature;
}  */

function verifyPaymentSignature(order_id, payment_id, signature) {
  // defensive checks
  if (!order_id || !payment_id || !signature) {
    console.warn('verifyPaymentSignature called with missing params:', { order_id, payment_id, signature });
    return false;
  }

  const hmac = crypto.createHmac('sha256', key_secret);
  hmac.update(`${order_id}|${payment_id}`);
  const expected = hmac.digest('hex');
  // << PUT LOG HERE >>
  console.log('/* PUT LOG HERE */ paymentService.verifyPaymentSignature -> expected:', expected, 'provided:', signature);
  return expected === signature;
}


/**
 * Verify webhook signature
 */
function verifyWebhookSignature(rawBody, signature, webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!webhookSecret) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return expected === signature;
}

/**
 * Thin wrapper: create order from cart by calling orderService
 * (keeps compatibility if other parts of code call paymentService.createOrderFromCart)
 */
async function createOrderFromCart(args) {
  // simply forward to orderService
  // << PUT LOG HERE >>
  console.log('/* PUT LOG HERE */ paymentService.createOrderFromCart -> forwarding to orderService, args.cartItems length:', Array.isArray(args.cartItems) ? args.cartItems.length : 0);
  return await orderService.createOrderFromCart(args);
}

/**
 * Complete order after successful payment
 */
async function completeOrderAfterPayment({ razorpay_order_id, razorpay_payment_id, userId, cartItems = [], shippingAddressId, retailerId }) {
  try {
    console.log('🔄 Starting order creation in completeOrderAfterPayment');

    // Calculate total amount defensively here too (for logging / double-check)
    const totalAmount = cartItems.reduce((total, item) => {
      const price = Number(item.Price ?? item.price ?? 0);
      const qty = Number(item.Qty ?? item.qty ?? 1);
      return total + (price * qty);
    }, 0);

    // << PUT LOG HERE >>
    console.log('/* PUT LOG HERE */ paymentService.completeOrderAfterPayment -> totalAmount (raw):', totalAmount, 'typeof:', typeof totalAmount);

    const totalToSend = Number(totalAmount.toFixed(2));
    console.log('/* PUT LOG HERE */ paymentService.completeOrderAfterPayment -> totalToSend (toFixed):', totalToSend);

    // Create order via orderService
    const order = await orderService.createOrderFromCart({
      userId,
      retailerId,
      shippingAddressId,
      cartItems,
      paymentGatewayOrderId: razorpay_order_id,
      paymentGatewayPaymentId: razorpay_payment_id
    });

    console.log('✅ Order created:', order);
    console.log('✅ Order ID:', order.Id);

    if (!order || !order.Id) {
      throw new Error('Order creation failed - no order ID returned');
    }

    // Create payment record
    const payment = await orderService.createPaymentRecord({
      orderId: order.Id,
      amount: totalToSend,
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
async function handleFailedPayment({ razorpay_order_id, razorpay_payment_id, userId, cartItems = [] }) {
  try {
    // Create order with failed status
    const order = await orderService.createFailedOrder({
      userId,
      paymentGatewayOrderId: razorpay_order_id,
      paymentGatewayPaymentId: razorpay_payment_id,
      status: 'FAILED',
      paymentStatus: 'FAILED'
    });

    // Create failed payment record (amount 0)
    const payment = await orderService.createPaymentRecord({
      orderId: order.Id,
      amount: 0,
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

module.exports = {
  razorpay,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createOrderFromCart,
  completeOrderAfterPayment,
  handleFailedPayment
};
