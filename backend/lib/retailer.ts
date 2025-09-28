// backend/lib/retailer.ts
import { getPool } from "./db";
import crypto from "crypto";

/**
 * createRetailer: creates a Users row with Role='RETAILER'
 */
export async function createRetailer(payload: { name: string, email: string, phone?: string, address?: any, initialPricing?: any }, createdById?: number) {
  const pool = await getPool();
  // generate referral code
  const referralCode = `RET-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const result = await pool.request()
    .input("Name", payload.name)
    .input("Email", payload.email)
    .input("ReferralCode", referralCode)
    .input("Role", "RETAILER")
    .query(`INSERT INTO dbo.Users (Name, Email, Role, ReferralCode) OUTPUT inserted.* VALUES (@Name, @Email, @Role, @ReferralCode)`);

  const user = result.recordset[0];
  // optionally insert address/profile and initial pricing (not implemented here)
  return user;
}
