const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const shippingAddressController = require('../controllers/shippingAddressController');

// All routes require authentication
router.use(verifyToken);

// GET /api/shipping-address - Get all addresses for user
router.get('/', shippingAddressController.getUserAddresses);

// GET /api/shipping-address/default - Get default address
router.get('/default', shippingAddressController.getDefaultAddress);

// GET /api/shipping-address/:id - Get specific address
router.get('/:id', shippingAddressController.getAddress);

// POST /api/shipping-address - Create new address
router.post('/', shippingAddressController.createAddress);

// PUT /api/shipping-address/:id - Update address
router.put('/:id', shippingAddressController.updateAddress);

// DELETE /api/shipping-address/:id - Delete address
router.delete('/:id', shippingAddressController.deleteAddress);

// PATCH /api/shipping-address/:id/set-default - Set address as default
router.patch('/:id/set-default', shippingAddressController.setDefaultAddress);

module.exports = router;