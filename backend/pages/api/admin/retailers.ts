// backend/pages/api/admin/retailers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../middleware/auth";
import { getPool } from "../../../lib/db";
import { createRetailer } from "../../../lib/retailer";

/**
 * POST -> create retailer
 * GET -> list retailers
 */

async function handler(req: any, res: NextApiResponse) {
  const pool = await getPool();

  if (req.method === "POST") {
    // admin only
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });
    const { name, email, phone, address, initialPricing, sendInvite } = req.body;
    const user = await createRetailer({ name, email, phone, address, initialPricing }, req.user.userId);
    // optionally send invite email (not implemented)
    res.status(201).json(user);
    return;
  }

  if (req.method === "GET") {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });
    const rows = await pool.request().query("SELECT Id, Name, Email, Role, ReferralCode, IsActive, CreatedAt FROM dbo.Users WHERE Role = 'RETAILER' ORDER BY CreatedAt DESC");
    return res.json(rows.recordset);
  }

  res.status(405).end();
}

export default requireAuth(handler, ["ADMIN"]);
