// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.get('/sales', verifyToken, ensureAdmin, reportController.getSalesReport);
router.get('/stock', verifyToken, ensureAdmin, reportController.getStockReport);
router.get('/customer', verifyToken, ensureAdmin, reportController.getCustomerReport);

module.exports = router;