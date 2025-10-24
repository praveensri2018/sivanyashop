// Place file at: backend/controllers/paymentsController.js
const paymentService = require('../services/paymentService');

/**
 * POST /api/payments/create-order
 * body: { amount: number (INR), currency?: string, receipt?: string, notes?: object }
 * response: { success: true, order }
 */
async function createOrder(req, res, next) {
  try {
    const { amount, currency = 'INR', receipt = null, notes = {} } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'amount (in rupees) required' });

    const order = await paymentService.createOrder({ amountInRupees: amount, currency, receipt, notes });
    return res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/verify
 * Called by frontend AFTER successful checkout (it receives razorpay_payment_id, razorpay_order_id, razorpay_signature)
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, cart/orderId? }
 */
async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const ok = paymentService.verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!ok) return res.status(400).json({ success: false, message: 'Signature verification failed' });

    // Optional: fetch payment details from Razorpay to confirm status
    // const payment = await paymentService.razorpay.payments.fetch(razorpay_payment_id);

    // TODO: mark order as paid in your DB, reduce stock, create invoice, etc.
    return res.json({ success: true, message: 'Payment verified', paymentId: razorpay_payment_id });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/webhook
 * Razorpay will POST events here. We must verify signature using raw body and X-Razorpay-Signature header.
 * Note: this route MUST be configured to parse raw body (see route registration below).
 */
async function webhookHandler(req, res, next) {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody; // we will attach rawBody in middleware when registering route
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!sig || !rawBody) {
      return res.status(400).json({ success: false, message: 'Missing signature or body' });
    }

    const verified = paymentService.verifyWebhookSignature(rawBody, sig, webhookSecret);
    if (!verified) {
      console.warn('Webhook signature mismatch');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const payload = req.body; // parsed JSON body (we validated raw above)
    // Handle events you care about, e.g. payment.authorized, payment.captured, order.paid, etc.
    // Example:
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      // TODO: mark payment in DB, update order status, send receipt, fulfill order
      console.log('Payment captured webhook:', paymentEntity && paymentEntity.id);
    }

    // return 200 quickly
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, verifyPayment, webhookHandler };
