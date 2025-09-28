// backend/lib/checkout.ts
import { getPool } from "./db";
import { getOrCreateCart, listCartItems } from "./cart";
import { adjustStock } from "./stock";
import { createLedgerEntry } from "./financial";

/**
 * This skeleton:
 * - reads cart items
 * - creates an Order and OrderItems (transaction)
 * - writes a Payments row (PENDING)
 * - returns a mock paymentIntent object (replace with real gateway)
 */

export async function createOrderFromCart(userId: number, shippingAddressId?: number) {
  const pool = await getPool();
  // create order in a transaction
  const tx = new (pool as any).Transaction(pool);
  await tx.begin();
  try {
    const cart = (await getOrCreateCart(userId));
    const items = await listCartItems(cart.Id);

    const total = items.reduce((s: number, it: any) => s + (it.Price * it.Qty), 0);

    const orderInsert = await tx.request()
      .input("UserId", userId)
      .input("RetailerId", null)
      .input("ShippingAddressId", shippingAddressId || null)
      .input("TotalAmount", total)
      .query(`INSERT INTO dbo.Orders (UserId, RetailerId, ShippingAddressId, TotalAmount)
              OUTPUT inserted.*
              VALUES (@UserId, @RetailerId, @ShippingAddressId, @TotalAmount)`);

    const order = orderInsert.recordset[0];

    // insert items
    for (const it of items) {
      await tx.request()
        .input("OrderId", order.Id)
        .input("ProductId", it.ProductId)
        .input("VariantId", it.VariantId)
        .input("Qty", it.Qty)
        .input("Price", it.Price)
        .query(`INSERT INTO dbo.OrderItems (OrderId, ProductId, VariantId, Qty, Price)
                VALUES (@OrderId, @ProductId, @VariantId, @Qty, @Price)`);
      // reduce stock (simple immediate decrement)
      await tx.request()
        .input("VariantId", it.VariantId)
        .input("Qty", it.Qty)
        .query(`UPDATE dbo.ProductVariants SET StockQty = StockQty - @Qty WHERE Id = @VariantId`);
    }

    // create payments row (PENDING)
    await tx.request().input("OrderId", order.Id).input("Amount", total).input("Method", "GATEWAY").query(`
      INSERT INTO dbo.Payments (OrderId, Amount, Method, Status) VALUES (@OrderId, @Amount, @Method, 'PENDING')
    `);

    await tx.commit();

    // return simple payment intent placeholder; replace with gateway SDK call
    return { orderId: order.Id, amount: total, paymentIntent: { clientSecret: "mock-client-secret" } };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
