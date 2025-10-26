// Place file at: backend/routes/paymentsRoutes.js
const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const { verifyToken } = require('../middleware/authMiddleware'); // optional: require auth for createOrder/verify

// Create order (authenticated if you want)
router.post('/create-order', verifyToken, paymentsController.createOrder);

// Verify payment (frontend posts the signature after checkout)
router.post('/verify', verifyToken, paymentsController.verifyPayment);

router.post('/check-stock', verifyToken, paymentsController.checkStock); 

// Webhook endpoint (no auth). Important: must use raw body parser for signature verification (see index.js changes).
router.post('/webhook', paymentsController.webhookHandler);

module.exports = router;
