// Place file at: backend/repositories/cartRepo.js
const { query, sql } = require('../lib/db');

/**
 * Find cart row for user
 */
async function getCartByUserId(userId) {
  const res = await query('SELECT Id, UserId, CreatedAt, UpdatedAt FROM dbo.Carts WHERE UserId = @userId', {
    userId: { type: sql.Int, value: userId }
  });
  return res.recordset && res.recordset[0] ? res.recordset[0] : null;
}

/**
 * Create a cart row for user
 */
async function createCartForUser(userId) {
  const res = await query('INSERT INTO dbo.Carts (UserId, CreatedAt) OUTPUT INSERTED.* VALUES (@userId, SYSUTCDATETIME())', {
    userId: { type: sql.Int, value: userId }
  });
  return res.recordset && res.recordset[0] ? res.recordset[0] : null;
}

/**
 * Find existing cart item for same product+variant in the cart
 */
async function findCartItem(cartId, productId, variantId) {
  const res = await query(
    `SELECT Id, CartId, ProductId, VariantId, Qty, Price FROM dbo.CartItems
     WHERE CartId = @cartId AND ProductId = @productId AND ((@variantId IS NULL AND VariantId IS NULL) OR VariantId = @variantId)`,
    {
      cartId: { type: sql.Int, value: cartId },
      productId: { type: sql.Int, value: productId },
      variantId: { type: sql.Int, value: variantId }
    }
  );
  return res.recordset && res.recordset[0] ? res.recordset[0] : null;
}

/**
 * Update an existing cart item (qty and price)
 * NOTE: update UpdatedAt NOT CreatedAt
 */
async function updateCartItemQty(cartItemId, qty, price = null) {
  const res = await query(
    `UPDATE dbo.CartItems
     SET Qty = @qty,
         Price = COALESCE(@price, Price),
         UpdatedAt = SYSUTCDATETIME()
     OUTPUT INSERTED.*
     WHERE Id = @id`,
    {
      id: { type: sql.Int, value: cartItemId },
      qty: { type: sql.Int, value: qty },
      price: { type: sql.Decimal, value: price }
    }
  );
  return res.recordset && res.recordset[0] ? res.recordset[0] : null;
}

/**
 * Insert a new CartItem
 */
async function insertCartItem(cartId, productId, variantId, qty, price) {
  const res = await query(
    `INSERT INTO dbo.CartItems (CartId, ProductId, VariantId, Qty, Price, CreatedAt)
     OUTPUT INSERTED.Id, INSERTED.CartId, INSERTED.ProductId, INSERTED.VariantId, INSERTED.Qty, INSERTED.Price
     VALUES (@cartId, @productId, @variantId, @qty, @price, SYSUTCDATETIME())`,
    {
      cartId: { type: sql.Int, value: cartId },
      productId: { type: sql.Int, value: productId },
      variantId: { type: sql.Int, value: variantId },
      qty: { type: sql.Int, value: qty },
      price: { type: sql.Decimal, value: price }
    }
  );
  return res.recordset && res.recordset[0] ? res.recordset[0] : null;
}

/**
 * Return full cart items for user (join products/variants)
 * Returns an array of item rows. Caller computes totals.
 */
async function getCartWithItems(userId) {
  const sqlText = `
    SELECT 
      ci.Id AS CartItemId,
      ci.CartId,
      ci.ProductId,
      ci.VariantId,
      ci.Qty,
      ci.Price,
      p.Name AS ProductName,
      ISNULL(img.ImageUrl, p.ImagePath) AS ImagePath,
      v.VariantName,
      v.SKU,
      v.Attributes
    FROM dbo.Carts c
    INNER JOIN dbo.CartItems ci ON ci.CartId = c.Id
    INNER JOIN dbo.Products p ON p.Id = ci.ProductId
    LEFT JOIN dbo.ProductVariants v ON v.Id = ci.VariantId
    OUTER APPLY (
      SELECT TOP 1 ImageUrl 
      FROM dbo.ProductImages i 
      WHERE i.ProductId = ci.ProductId 
      ORDER BY i.IsPrimary DESC, i.Id ASC
    ) AS img
    WHERE c.UserId = @userId
    ORDER BY ci.Id DESC;
  `;
  const res = await query(sqlText, { userId: { type: sql.Int, value: userId } });
  return res.recordset || [];
}

/**
 * Delete cart item ensuring it belongs to user
 * Returns the raw result (rowsAffected etc.) so caller can inspect.
 */
async function deleteCartItem(userId, cartItemId) {
  const res = await query(
    `DELETE ci
     FROM dbo.CartItems ci
     INNER JOIN dbo.Carts c ON ci.CartId = c.Id
     WHERE ci.Id = @cartItemId AND c.UserId = @userId`,
    { cartItemId: { type: sql.Int, value: cartItemId }, userId: { type: sql.Int, value: userId } }
  );
  return res; // callers can check res.rowsAffected
}

/**
 * Helper: get latest variant price
 */
async function getVariantLatestPrice(variantId, priceType = 'CUSTOMER') {
  if (!variantId) return null;
  const res = await query(
    `SELECT TOP 1 Price FROM dbo.VariantPrices
     WHERE VariantId = @variantId AND PriceType = @priceType AND IsActive = 1
     ORDER BY Id DESC`,
    {
      variantId: { type: sql.Int, value: variantId },
      priceType: { type: sql.NVarChar, value: priceType }
    }
  );
  return res.recordset && res.recordset[0] ? res.recordset[0].Price : null;
}

module.exports = {
  getVariantLatestPrice,
  getCartByUserId,
  createCartForUser,
  findCartItem,
  updateCartItemQty,
  insertCartItem,
  getCartWithItems,
  deleteCartItem
};
