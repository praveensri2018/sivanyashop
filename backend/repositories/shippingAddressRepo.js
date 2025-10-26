const { query, sql } = require('../lib/db');

async function getUserAddresses(userId) {
    const result = await query(`
        SELECT 
            Id, UserId, AddressLine1, AddressLine2, City, State, 
            PostalCode, Country, IsDefault, CreatedAt
        FROM dbo.UserAddresses 
        WHERE UserId = @userId
        ORDER BY IsDefault DESC, Id DESC
    `, {
        userId: { type: sql.Int, value: userId }
    });
    return result.recordset || [];
}

async function getAddressById(addressId, userId = null) {
    let sqlText = `
        SELECT Id, UserId, AddressLine1, AddressLine2, City, State, 
               PostalCode, Country, IsDefault, CreatedAt
        FROM dbo.UserAddresses 
        WHERE Id = @addressId
    `;
    
    const params = { addressId: { type: sql.Int, value: addressId } };
    
    if (userId) {
        sqlText += ' AND UserId = @userId';
        params.userId = { type: sql.Int, value: userId };
    }
    
    const result = await query(sqlText, params);
    return result.recordset[0] || null;
}

async function createAddress(addressData) {
    const { userId, addressLine1, addressLine2, city, state, postalCode, country = 'India', isDefault = false } = addressData;
    
    // If setting as default, remove default from other addresses
    if (isDefault) {
        await query(`
            UPDATE dbo.UserAddresses 
            SET IsDefault = 0 
            WHERE UserId = @userId
        `, { userId: { type: sql.Int, value: userId } });
    }
    
    const result = await query(`
        INSERT INTO dbo.UserAddresses 
            (UserId, AddressLine1, AddressLine2, City, State, PostalCode, Country, IsDefault)
        OUTPUT INSERTED.*
        VALUES (@userId, @addressLine1, @addressLine2, @city, @state, @postalCode, @country, @isDefault)
    `, {
        userId: { type: sql.Int, value: userId },
        addressLine1: { type: sql.NVarChar, value: addressLine1 },
        addressLine2: { type: sql.NVarChar, value: addressLine2 || null },
        city: { type: sql.NVarChar, value: city },
        state: { type: sql.NVarChar, value: state },
        postalCode: { type: sql.NVarChar, value: postalCode },
        country: { type: sql.NVarChar, value: country },
        isDefault: { type: sql.Bit, value: isDefault }
    });
    
    return result.recordset[0];
}

async function updateAddress(addressId, userId, addressData) {
    const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = addressData;
    
    // If setting as default, remove default from other addresses
    if (isDefault) {
        await query(`
            UPDATE dbo.UserAddresses 
            SET IsDefault = 0 
            WHERE UserId = @userId AND Id != @addressId
        `, { 
            userId: { type: sql.Int, value: userId },
            addressId: { type: sql.Int, value: addressId }
        });
    }
    
    const result = await query(`
        UPDATE dbo.UserAddresses 
        SET 
            AddressLine1 = COALESCE(@addressLine1, AddressLine1),
            AddressLine2 = COALESCE(@addressLine2, AddressLine2),
            City = COALESCE(@city, City),
            State = COALESCE(@state, State),
            PostalCode = COALESCE(@postalCode, PostalCode),
            Country = COALESCE(@country, Country),
            IsDefault = COALESCE(@isDefault, IsDefault)
        OUTPUT INSERTED.*
        WHERE Id = @addressId AND UserId = @userId
    `, {
        addressId: { type: sql.Int, value: addressId },
        userId: { type: sql.Int, value: userId },
        addressLine1: { type: sql.NVarChar, value: addressLine1 || null },
        addressLine2: { type: sql.NVarChar, value: addressLine2 || null },
        city: { type: sql.NVarChar, value: city || null },
        state: { type: sql.NVarChar, value: state || null },
        postalCode: { type: sql.NVarChar, value: postalCode || null },
        country: { type: sql.NVarChar, value: country || null },
        isDefault: { type: sql.Bit, value: typeof isDefault === 'boolean' ? isDefault : null }
    });
    
    return result.recordset[0] || null;
}

async function deleteAddress(addressId, userId) {
    const result = await query(`
        DELETE FROM dbo.UserAddresses 
        WHERE Id = @addressId AND UserId = @userId
    `, {
        addressId: { type: sql.Int, value: addressId },
        userId: { type: sql.Int, value: userId }
    });
    
    return result.rowsAffected[0] > 0;
}

async function setDefaultAddress(addressId, userId) {
    // Start transaction
    const pool = await require('../lib/db').getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        
        // Remove default from all addresses
        await transaction.request()
            .input('userId', sql.Int, userId)
            .query('UPDATE dbo.UserAddresses SET IsDefault = 0 WHERE UserId = @userId');
        
        // Set new default
        const result = await transaction.request()
            .input('addressId', sql.Int, addressId)
            .input('userId', sql.Int, userId)
            .query(`
                UPDATE dbo.UserAddresses 
                SET IsDefault = 1 
                OUTPUT INSERTED.*
                WHERE Id = @addressId AND UserId = @userId
            `);
        
        await transaction.commit();
        return result.recordset[0] || null;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function getDefaultAddress(userId) {
    const result = await query(`
        SELECT Id, UserId, AddressLine1, AddressLine2, City, State, 
               PostalCode, Country, IsDefault, CreatedAt
        FROM dbo.UserAddresses 
        WHERE UserId = @userId AND IsDefault = 1
    `, {
        userId: { type: sql.Int, value: userId }
    });
    
    return result.recordset[0] || null;
}

module.exports = {
    getUserAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress
};