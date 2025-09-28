// backend/utils/idempotency.ts
import { getPool } from "../lib/db";

/**
 * Very small idempotency store using SQL table (create if needed)
 * Table suggestion:
 * CREATE TABLE dbo.Idempotency (Id INT IDENTITY(1,1) PRIMARY KEY, EventId NVARCHAR(200) UNIQUE, CreatedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET());
 */

export async function isEventProcessed(eventId: string) {
  const pool = await getPool();
  const r = await pool.request().input("EventId", eventId).query("SELECT 1 FROM dbo.Idempotency WHERE EventId = @EventId");
  return r.recordset.length > 0;
}

export async function markEventProcessed(eventId: string) {
  const pool = await getPool();
  await pool.request().input("EventId", eventId).query("INSERT INTO dbo.Idempotency (EventId) VALUES (@EventId)");
}
