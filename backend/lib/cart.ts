// backend/lib/cart.ts
import { getPool } from "./db";

export async function getOrCreateCart(userId: number) {
  const pool = await getPool();
  const r = await pool.request().input("UserId", userId).query("SELECT * FROM dbo.Carts WHERE UserId = @UserId");
  if (r.recordset[0]) return r.recordset[0];
  const ins = await pool.request().input("UserId", userId).query("INSERT INTO dbo.Carts (UserId) OUTPUT inserted.* VALUES (@UserId)");
  return ins.recordset[0];
}

export async function addItem(cartId: number, productId: number, variantId: number, qty: number, price: number) {
  const pool = await getPool();
  const ins = await pool.request()
    .input("CartId", cartId)
    .input("ProductId", productId)
    .input("VariantId", variantId)
    .input("Qty", qty)
    .input("Price", price)
    .query(`INSERT INTO dbo.CartItems (CartId, ProductId, VariantId, Qty, Price)
            OUTPUT inserted.*
            VALUES (@CartId, @ProductId, @VariantId, @Qty, @Price)`);
  return ins.recordset[0];
}

export async function listCartItems(cartId: number) {
  const pool = await getPool();
  const r = await pool.request().input("CartId", cartId).query("SELECT * FROM dbo.CartItems WHERE CartId = @CartId");
  return r.recordset;
}
