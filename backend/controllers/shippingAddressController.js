const shippingAddressService = require('../services/shippingAddressService');

async function getUserAddresses(req, res, next) {
    try {
        const userId = req.user.id;
        const addresses = await shippingAddressService.getUserAddresses(userId);
        res.json({ success: true, addresses });
    } catch (err) {
        next(err);
    }
}

async function getAddress(req, res, next) {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.user.id;
        
        const address = await shippingAddressService.getAddress(addressId, userId);
        res.json({ success: true, address });
    } catch (err) {
        next(err);
    }
}

async function createAddress(req, res, next) {
    try {
        const userId = req.user.id;
        const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
        
        const addressData = {
            userId,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            isDefault: Boolean(isDefault)
        };
        
        const newAddress = await shippingAddressService.createAddress(addressData);
        res.status(201).json({ success: true, address: newAddress });
    } catch (err) {
        next(err);
    }
}

async function updateAddress(req, res, next) {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.user.id;
        const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
        
        const addressData = {
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            isDefault: typeof isDefault === 'boolean' ? isDefault : undefined
        };
        
        const updatedAddress = await shippingAddressService.updateAddress(addressId, userId, addressData);
        res.json({ success: true, address: updatedAddress });
    } catch (err) {
        next(err);
    }
}

async function deleteAddress(req, res, next) {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.user.id;
        
        await shippingAddressService.deleteAddress(addressId, userId);
        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (err) {
        next(err);
    }
}

async function setDefaultAddress(req, res, next) {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.user.id;
        
        const updatedAddress = await shippingAddressService.setDefaultAddress(addressId, userId);
        res.json({ success: true, address: updatedAddress });
    } catch (err) {
        next(err);
    }
}

async function getDefaultAddress(req, res, next) {
    try {
        const userId = req.user.id;
        
        const address = await shippingAddressService.getDefaultAddress(userId);
        res.json({ success: true, address });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getUserAddresses,
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress
};