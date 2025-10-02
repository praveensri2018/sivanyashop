// => PLACE: backend/routes/product.js
const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// Admin-only product management
router.post('/category', verifyToken, ensureAdmin, productController.createCategory);
router.post('/product', verifyToken, ensureAdmin, productController.createProduct);
router.post('/variant', verifyToken, ensureAdmin, productController.createVariant);
router.post('/variant/price', verifyToken, ensureAdmin, productController.setPrice);
router.put('/variant/price', verifyToken, ensureAdmin, productController.updatePrice);

module.exports = router;
