// backend/pages/api/orders/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../middleware/auth";
import { getPool } from "../../../lib/db";

async function handler(req: any, res: NextApiResponse) {
  const pool = await getPool();
  const id = Number(req.query.id);
  const r = await pool.request().input("Id", id).query("SELECT * FROM dbo.Orders WHERE Id = @Id");
  if (!r.recordset[0]) return res.status(404).json({ error: "not_found" });
  const order = r.recordset[0];
  // RBAC: admin can view all, retailer if matches, customer if owns
  const user = req.user;
  if (user.role === "ADMIN" || (user.role === "RETAILER" && order.RetailerId === user.userId) || (user.role === "CUSTOMER" && order.UserId === user.userId)) {
    const items = await pool.request().input("OrderId", id).query("SELECT * FROM dbo.OrderItems WHERE OrderId = @OrderId");
    return res.json({ order, items: items.recordset });
  }
  return res.status(403).json({ error: "forbidden" });
}

export default requireAuth(handler);
