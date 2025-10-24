// Place file at: backend/services/paymentService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

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

module.exports = { razorpay, createOrder, verifyPaymentSignature, verifyWebhookSignature };
