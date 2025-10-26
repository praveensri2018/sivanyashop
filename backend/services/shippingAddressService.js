const shippingAddressRepo = require('../repositories/shippingAddressRepo');

class ShippingAddressService {
    async getUserAddresses(userId) {
        if (!userId) {
            throw { status: 400, message: 'User ID is required' };
        }
        
        return await shippingAddressRepo.getUserAddresses(userId);
    }
    
    async getAddress(addressId, userId = null) {
        if (!addressId) {
            throw { status: 400, message: 'Address ID is required' };
        }
        
        const address = await shippingAddressRepo.getAddressById(addressId, userId);
        if (!address) {
            throw { status: 404, message: 'Address not found' };
        }
        
        return address;
    }
    
    async createAddress(addressData) {
        const { userId, addressLine1, city, state, postalCode } = addressData;
        
        if (!userId || !addressLine1 || !city || !state || !postalCode) {
            throw { status: 400, message: 'Missing required fields: userId, addressLine1, city, state, postalCode' };
        }
        
        return await shippingAddressRepo.createAddress(addressData);
    }
    
    async updateAddress(addressId, userId, addressData) {
        if (!addressId || !userId) {
            throw { status: 400, message: 'Address ID and User ID are required' };
        }
        
        const updated = await shippingAddressRepo.updateAddress(addressId, userId, addressData);
        if (!updated) {
            throw { status: 404, message: 'Address not found or you do not have permission to update it' };
        }
        
        return updated;
    }
    
    async deleteAddress(addressId, userId) {
        if (!addressId || !userId) {
            throw { status: 400, message: 'Address ID and User ID are required' };
        }
        
        const deleted = await shippingAddressRepo.deleteAddress(addressId, userId);
        if (!deleted) {
            throw { status: 404, message: 'Address not found or you do not have permission to delete it' };
        }
        
        return { message: 'Address deleted successfully' };
    }
    
    async setDefaultAddress(addressId, userId) {
        if (!addressId || !userId) {
            throw { status: 400, message: 'Address ID and User ID are required' };
        }
        
        // Verify address belongs to user
        const address = await shippingAddressRepo.getAddressById(addressId, userId);
        if (!address) {
            throw { status: 404, message: 'Address not found' };
        }
        
        return await shippingAddressRepo.setDefaultAddress(addressId, userId);
    }
    
    async getDefaultAddress(userId) {
        if (!userId) {
            throw { status: 400, message: 'User ID is required' };
        }
        
        const address = await shippingAddressRepo.getDefaultAddress(userId);
        if (!address) {
            throw { status: 404, message: 'No default address found' };
        }
        
        return address;
    }
}

module.exports = new ShippingAddressService();