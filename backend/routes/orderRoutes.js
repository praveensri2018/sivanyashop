// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { ensureAdmin, ensureRetailer } = require('../middleware/roleMiddleware');
const orderController = require('../controllers/orderController');
const paymentHistoryController = require('../controllers/paymentHistoryController'); // Add this import

router.post('/:id/confirm', verifyToken, orderController.confirmOrder);

router.get('/history', verifyToken, orderController.getOrderHistory); // User order history
router.get('/admin/history', verifyToken, ensureAdmin, orderController.getAdminOrderHistory); // Admin order history

// ORDER DETAILS ROUTES
router.get('/:id', verifyToken, orderController.getOrderDetails);
router.post('/:id/refund', verifyToken, orderController.requestRefund);

// PAYMENT HISTORY ROUTES
router.get('/history/payments', verifyToken, paymentHistoryController.getPaymentHistory);
router.get('/payment/:id', verifyToken, paymentHistoryController.getPaymentDetails);

// ADMIN ROUTES
router.get('/admin/list', verifyToken, ensureAdmin, orderController.getOrderReports);
router.put('/admin/:id/status', verifyToken, ensureAdmin, orderController.updateOrderStatus);


module.exports = router;