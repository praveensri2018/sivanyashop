// backend/lib/stock.ts
import { getPool } from "./db";

export async function adjustStock(variantId: number, diffQty: number, movementType: string, refOrderId?: number, refOrderItemId?: number) {
  const pool = await getPool();
  const tx = new (pool as any).Transaction(pool);
  await tx.begin();
  try {
    await tx.request().input("VariantId", variantId).input("Diff", diffQty).query("UPDATE dbo.ProductVariants SET StockQty = StockQty + @Diff WHERE Id = @VariantId");
    await tx.request()
      .input("ProductId", null)
      .input("VariantId", variantId)
      .input("RefOrderId", refOrderId || null)
      .input("RefOrderItemId", refOrderItemId || null)
      .input("MovementType", movementType)
      .input("Quantity", diffQty)
      .query(`INSERT INTO dbo.StockLedger (ProductId, VariantId, RefOrderId, RefOrderItemId, MovementType, Quantity) VALUES
        (@ProductId, @VariantId, @RefOrderId, @RefOrderItemId, @MovementType, @Quantity)`);
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
