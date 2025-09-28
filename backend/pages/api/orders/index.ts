// backend/pages/api/orders/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../middleware/auth";
import { getPool } from "../../../lib/db";

async function handler(req: any, res: NextApiResponse) {
  const pool = await getPool();
  const user = req.user;
  if (user.role === "ADMIN") {
    const rows = await pool.request().query("SELECT * FROM dbo.Orders ORDER BY CreatedAt DESC");
    return res.json(rows.recordset);
  }
  if (user.role === "RETAILER") {
    const rows = await pool.request().input("RetailerId", user.userId).query("SELECT * FROM dbo.Orders WHERE RetailerId = @RetailerId ORDER BY CreatedAt DESC");
    return res.json(rows.recordset);
  }
  // customer
  const rows = await pool.request().input("UserId", user.userId).query("SELECT * FROM dbo.Orders WHERE UserId = @UserId ORDER BY CreatedAt DESC");
  return res.json(rows.recordset);
}

export default requireAuth(handler);
