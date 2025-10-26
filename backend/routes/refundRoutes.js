// backend/routes/refundRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { ensureAdmin, ensureRetailer } = require('../middleware/roleMiddleware');
const refundController = require('../controllers/refundController');

// 🔹 CUSTOMER ROUTES
// Get refund requests for customer's own orders
router.get('/my-refunds', verifyToken, refundController.getMyRefundRequests);

// Create refund request for customer's order
router.post('/request', verifyToken, refundController.createRefundRequest);

// Get specific refund details (customer can only see their own)
router.get('/my-refunds/:id', verifyToken, refundController.getMyRefundDetails);

// 🔹 RETAILER ROUTES  
// Get refund requests for retailer's products
router.get('/retailer/requests', verifyToken, ensureRetailer, refundController.getRetailerRefundRequests);

// Update refund status (retailer can approve/reject for their products)
router.put('/retailer/:id/status', verifyToken, ensureRetailer, refundController.updateRefundStatus);

// 🔹 ADMIN ROUTES
// Get all refund requests (admin overview)
router.get('/admin/requests', verifyToken, ensureAdmin, refundController.getAllRefundRequests);

// Get specific refund details (admin)
router.get('/admin/requests/:id', verifyToken, ensureAdmin, refundController.getRefundDetails);

// Process refund (final approval and payment reversal)
router.put('/admin/requests/:id/process', verifyToken, ensureAdmin, refundController.processRefund);

// Get refund statistics
router.get('/admin/stats', verifyToken, ensureAdmin, refundController.getRefundStats);

module.exports = router;