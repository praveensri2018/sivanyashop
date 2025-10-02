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
router.get('/all', verifyToken, ensureAdmin, productController.getAllProducts);
router.get('/categories', verifyToken, ensureAdmin, productController.getAllCategories);
router.put('/product/:id', verifyToken, ensureAdmin, productController.updateProduct);
router.get('/', verifyToken, ensureAdmin, productController.getProductsPaginated);
router.delete('/:id', verifyToken, ensureAdmin, productController.deleteProduct);
router.delete('/:id/categories', verifyToken, ensureAdmin, productController.deleteProductCategories);

module.exports = router;
