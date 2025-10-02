// backend/repositories/productImageRepo.js
const { query, sql } = require('../lib/db');

async function addProductImage(productId, imageUrl, isPrimary = false) {
  const result = await query(
    'INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary) OUTPUT INSERTED.Id VALUES (@productId, @imageUrl, @isPrimary)',
    {
      productId: { type: sql.Int, value: productId },
      imageUrl: { type: sql.NVarChar, value: imageUrl },
      isPrimary: { type: sql.Bit, value: isPrimary }
    }
  );
  return result.recordset[0];
}

module.exports = { addProductImage }; // ✅ export as object
