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


async function getVariantStockById(variantId) {
  const result = await query(
    `SELECT Id AS VariantId, ProductId, VariantName, StockQty
     FROM dbo.ProductVariants
     WHERE Id = @variantId`,
    { variantId: { type: sql.Int, value: variantId } }
  );
  return result.recordset && result.recordset[0] ? result.recordset[0] : null;
}

async function tryDecrementVariantStock(variantId, qty) {
  const res = await query(
    `UPDATE dbo.ProductVariants
     SET StockQty = StockQty - @qty
     WHERE Id = @variantId AND StockQty >= @qty;
     SELECT @@ROWCOUNT as rowsAffected;`,
    { variantId: { type: sql.Int, value: variantId }, qty: { type: sql.Int, value: qty } }
  );
  // Some DB helpers may return recordset[0].rowsAffected differently; adapt if needed
  const rows = res && res.recordset && res.recordset[0] ? Number(res.recordset[0].rowsAffected || res.rowsAffected?.[0] || res.rowsAffected) : 0;
  return rows > 0;
}

module.exports = { insertStockLedger, fetchStockLedger, fetchProductStock,getVariantStockById,tryDecrementVariantStock };
