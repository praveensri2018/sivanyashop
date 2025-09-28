// backend/pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../middleware/auth";
import { getPool } from "../../../lib/db";

async function handler(req: any, res: NextApiResponse) {
  const uid = req.user.userId;
  const pool = await getPool();
  const r = await pool.request().input("Id", uid).query("SELECT Id, Name, Email, Role, ReferralCode, IsActive FROM dbo.Users WHERE Id = @Id");
  const u = r.recordset[0];
  if (!u) return res.status(404).json({ error: "not_found" });
  res.json(u);
}

export default requireAuth(handler);
