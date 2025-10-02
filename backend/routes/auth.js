// => PLACE: backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');

// Login
router.post('/login', authController.login);

// Public registration (Customer)
router.post('/register', authController.registerCustomer);

// Admin registration (Retailer)
router.post('/register/retailer', verifyToken, ensureAdmin, authController.registerRetailer);

module.exports = router;
