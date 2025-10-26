const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const sizeChartController = require('../controllers/sizeChartController');

// Admin only routes
router.post('/', verifyToken, ensureAdmin, sizeChartController.createSizeChart);
router.get('/', verifyToken, ensureAdmin, sizeChartController.getSizeCharts);
router.get('/:id', verifyToken, ensureAdmin, sizeChartController.getSizeChartById);
router.put('/:id', verifyToken, ensureAdmin, sizeChartController.updateSizeChart);
router.delete('/:id', verifyToken, ensureAdmin, sizeChartController.deleteSizeChart);

// Product size chart associations (Admin only)
router.post('/assign', verifyToken, ensureAdmin, sizeChartController.assignSizeChartToProduct);
router.post('/remove', verifyToken, ensureAdmin, sizeChartController.removeSizeChartFromProduct);
router.post('/set-primary', verifyToken, ensureAdmin, sizeChartController.setPrimarySizeChart);

// Public routes (for customer facing)
router.get('/product/:productId', sizeChartController.getProductSizeCharts);
router.get('/product/:productId/primary', sizeChartController.getPrimarySizeChart);

module.exports = router;