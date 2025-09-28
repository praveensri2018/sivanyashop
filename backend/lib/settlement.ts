// backend/lib/settlement.ts
import { getPool } from "./db";
import { createLedgerEntry } from "./financial";

/**
 * handlePaymentSuccess: example skeleton
 * - mark payment success
 * - compute admin vs retailer amounts
 * - insert financial ledger rows
 */

export async function handlePaymentSuccess(orderId: number, event: any) {
  const pool = await getPool();
  const tx = new (pool as any).Transaction(pool);
  await tx.begin();
  try {
    // mark payment(s) for order as succeeded
    await tx.request().input("OrderId", orderId).query(`UPDATE dbo.Payments SET Status = 'COMPLETED' WHERE OrderId = @OrderId`);

    // mark order payment status
    await tx.request().input("OrderId", orderId).query(`UPDATE dbo.Orders SET PaymentStatus = 'PAID' WHERE Id = @OrderId`);

    // sample: compute sums
    const items = await tx.request().input("OrderId", orderId).query("SELECT Qty, Price, VariantId FROM dbo.OrderItems WHERE OrderId = @OrderId");
    const orderRow = await tx.request().input("OrderId", orderId).query("SELECT UserId, RetailerId, TotalAmount FROM dbo.Orders WHERE Id = @OrderId");
    const order = orderRow.recordset[0];

    // naive profit split example: if RetailerId exists, admin gets wholesale and retailer gets margin
    if (order.RetailerId) {
      // lookup wholesale price per variant from RetailerVariantPrices or VariantPrices; this is simplified
      for (const it of items.recordset) {
        // fetch wholesale price
        const wp = await tx.request().input("VariantId", it.VariantId).query(`
          SELECT TOP(1) WholesalePrice FROM dbo.RetailerVariantPrices WHERE VariantId = @VariantId AND RetailerId = @RetailerId AND IsActive = 1
        `).input("RetailerId", order.RetailerId);
        const wholesale = (wp.recordset[0] && wp.recordset[0].WholesalePrice) || 0;
        const adminAmt = wholesale * it.Qty;
        const customerPaidAmt = it.Price * it.Qty;
        const retailerAmt = customerPaidAmt - adminAmt;

        // insert ledger entries
        await tx.request().input("UserId", order.UserId).input("RefOrderId", orderId)
          .input("LedgerType", "SALE").input("Amount", customerPaidAmt).input("Narration", `Sale to customer`).query(`
            INSERT INTO dbo.FinancialLedger (UserId, RefOrderId, LedgerType, Amount, Narration) VALUES (@UserId, @RefOrderId, @LedgerType, @Amount, @Narration)
        `);

        await tx.request().input("UserId", order.RetailerId).input("RefOrderId", orderId)
          .input("LedgerType", "RETAILER_PROFIT").input("Amount", retailerAmt).input("Narration", `Retailer margin`).query(`
            INSERT INTO dbo.FinancialLedger (UserId, RefOrderId, LedgerType, Amount, Narration) VALUES (@UserId, @RefOrderId, @LedgerType, @Amount, @Narration)
        `);

        await tx.request().input("UserId", null).input("RefOrderId", orderId)
          .input("LedgerType", "ADMIN_REVENUE").input("Amount", adminAmt).input("Narration", `Admin revenue`).query(`
            INSERT INTO dbo.FinancialLedger (UserId, RefOrderId, LedgerType, Amount, Narration) VALUES (@UserId, @RefOrderId, @LedgerType, @Amount, @Narration)
        `);
      }
    } else {
      // direct customer sale => admin gets full amount
      await tx.request().input("UserId", null).input("RefOrderId", orderId)
        .input("LedgerType", "ADMIN_REVENUE").input("Amount", order.TotalAmount).input("Narration", `Direct sale`).query(`
          INSERT INTO dbo.FinancialLedger (UserId, RefOrderId, LedgerType, Amount, Narration) VALUES (@UserId, @RefOrderId, @LedgerType, @Amount, @Narration)
      `);
    }

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
