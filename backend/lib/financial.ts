// backend/lib/financial.ts
import { getPool } from "./db";

export async function createLedgerEntry({ userId, accountSegment, refOrderId, refOrderItemId, refPaymentId, ledgerType, amount, narration }: any) {
  const pool = await getPool();
  await pool.request()
    .input("UserId", userId || null)
    .input("AccountSegment", accountSegment || null)
    .input("RefOrderId", refOrderId || null)
    .input("RefOrderItemId", refOrderItemId || null)
    .input("RefPaymentId", refPaymentId || null)
    .input("LedgerType", ledgerType)
    .input("Amount", amount)
    .input("Narration", narration || null)
    .query(`INSERT INTO dbo.FinancialLedger (UserId, AccountSegment, RefOrderId, RefOrderItemId, RefPaymentId, LedgerType, Amount, Narration) VALUES
            (@UserId, @AccountSegment, @RefOrderId, @RefOrderItemId, @RefPaymentId, @LedgerType, @Amount, @Narration)`);
}
