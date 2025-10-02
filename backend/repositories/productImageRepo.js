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


async function getProductImageById(imageId) {
  const result = await query('SELECT * FROM dbo.ProductImages WHERE Id = @id', { id: { type: sql.Int, value: imageId } });
  return result.recordset[0];
}

async function deleteProductImageById(imageId) {
  await query('DELETE FROM dbo.ProductImages WHERE Id = @id', { id: { type: sql.Int, value: imageId } });
  return { success: true };
}

module.exports = {   addProductImage,
  getProductImageById,
  deleteProductImageById, }; // ✅ export as object
