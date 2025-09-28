// backend/lib/price-resolver.ts
import { getPool } from "./db";

/**
 * Resolve effective price for a variant given an optional customerId (to check linkage).
 * Rules (skeleton):
 * - If customer linked to retailer and retailer has active RetailerVariantPrices (RetailerSellingPrice) -> use it
 * - Else use VariantPrices where PriceType='CUSTOMER' and IsActive=1
 * - Also return wholesalePrice if exists
 */

export async function getCustomerLinkedRetailer(customerId: number | null) {
  if (!customerId) return null;
  const pool = await getPool();
  const r = await pool.request().input("CustomerId", customerId).query("SELECT RetailerId FROM dbo.CustomerReferrals WHERE CustomerId = @CustomerId");
  return r.recordset[0] ? r.recordset[0].RetailerId : null;
}

export async function resolveEffectivePrice({ customerId, variantId }: { customerId?: number | null; variantId: number }) {
  const pool = await getPool();
  const retailerId = customerId ? await getCustomerLinkedRetailer(customerId) : null;

  if (retailerId) {
    const r = await pool.request()
      .input("RetailerId", retailerId)
      .input("VariantId", variantId)
      .query(`SELECT TOP(1) WholesalePrice, RetailerSellingPrice, EffectiveFrom, EffectiveTo, IsActive
              FROM dbo.RetailerVariantPrices
              WHERE RetailerId = @RetailerId AND VariantId = @VariantId AND IsActive = 1
              ORDER BY EffectiveFrom DESC`);
    const rec = r.recordset[0];
    if (rec && (rec.RetailerSellingPrice || rec.WholesalePrice)) {
      return { unitPrice: rec.RetailerSellingPrice ?? rec.WholesalePrice, source: "RETAILER", wholesalePrice: rec.WholesalePrice ?? null };
    }
  }

  // fallback to customer variant price
  const r2 = await pool.request().input("VariantId", variantId).query(`
    SELECT TOP(1) Price, PriceType FROM dbo.VariantPrices
    WHERE VariantId = @VariantId AND PriceType = 'CUSTOMER' AND IsActive = 1
    ORDER BY EffectiveFrom DESC
  `);
  if (r2.recordset[0]) {
    return { unitPrice: r2.recordset[0].Price, source: "CUSTOMER", wholesalePrice: null };
  }

  throw new Error("price_not_found");
}
