const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const stockController = require('../controllers/stockController');

// Manual stock adjustment
router.post('/adjust', verifyToken, ensureAdmin, stockController.adjustStock);

// Stock ledger
router.get('/ledger', verifyToken, ensureAdmin, stockController.getStockLedger);

// Current stock for product
router.get('/:productId', verifyToken, ensureAdmin, stockController.getProductStock);

module.exports = router;
