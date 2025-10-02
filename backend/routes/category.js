// backend/routes/category.js
const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const categoryController = require('../controllers/categoryController');

router.put('/:id', verifyToken, ensureAdmin, categoryController.updateCategory);
router.delete('/:id', verifyToken, ensureAdmin, categoryController.deleteCategory);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id/products', categoryController.getProductsByCategory);

module.exports = router;
