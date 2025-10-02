const { query, sql } = require('../lib/db');

async function insertStockLedger({ productId, variantId, quantity, movementType }) {
  await query(
    'INSERT INTO dbo.StockLedger (ProductId, VariantId, MovementType, Quantity) VALUES (@productId, @variantId, @movementType, @quantity)',
    {
      productId: { type: sql.Int, value: productId },
      variantId: { type: sql.Int, value: variantId },
      movementType: { type: sql.NVarChar, value: movementType },
      quantity: { type: sql.Int, value: quantity },
    }
  );
}

async function fetchStockLedger() {
  const result = await query('SELECT * FROM dbo.StockLedger ORDER BY CreatedAt DESC');
  return result.recordset;
}

async function fetchProductStock(productId) {
  const result = await query(`
    SELECT v.Id AS VariantId, v.VariantName, v.StockQty
    FROM dbo.ProductVariants v
    WHERE v.ProductId = @productId
  `, { productId: { type: sql.Int, value: productId } });
  return result.recordset;
}

module.exports = { insertStockLedger, fetchStockLedger, fetchProductStock };
