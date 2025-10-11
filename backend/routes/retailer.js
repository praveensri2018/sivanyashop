// PLACE: backend/routes/retailer.js
const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const retailerController = require('../controllers/retailerController');

// Admin protected CRUD
router.get('/', verifyToken, ensureAdmin, retailerController.listRetailers);
router.get('/:id', verifyToken, ensureAdmin, retailerController.getRetailer);
router.post('/', verifyToken, ensureAdmin, retailerController.createRetailer);
router.put('/:id', verifyToken, ensureAdmin, retailerController.updateRetailer);
router.delete('/:id', verifyToken, ensureAdmin, retailerController.deleteRetailer);

module.exports = router;
