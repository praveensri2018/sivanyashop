// PLACE: backend/routes/cartRoutes.js
const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

const router = express.Router();

// --- AUTHENTICATED CART ROUTES ---
router.post('/', verifyToken, cartController.addToCart);
router.get('/', verifyToken, cartController.getCart);
router.delete('/:id', verifyToken, cartController.removeFromCart);

module.exports = router;
