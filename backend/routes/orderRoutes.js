// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { ensureAdmin, ensureRetailer } = require('../middleware/roleMiddleware');
const orderController = require('../controllers/orderController');

// ORDER CONFIRMATION ROUTE - Add this
router.post('/:id/confirm', verifyToken, orderController.confirmOrder);

router.get('/history', verifyToken, orderController.getOrderHistory);
router.get('/:id', verifyToken, orderController.getOrderDetails);
router.post('/:id/refund', verifyToken, orderController.requestRefund);

// ADMIN ROUTES
router.get('/admin/list', verifyToken, ensureAdmin, orderController.getOrderReports);
router.put('/admin/:id/status', verifyToken, ensureAdmin, orderController.updateOrderStatus);

module.exports = router;