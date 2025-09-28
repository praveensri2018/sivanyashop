// backend/pages/api/products/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await getPool();
    const rows = await pool.request().query("SELECT Id, Name, Description, ImagePath, IsActive FROM dbo.Products WHERE IsActive = 1 ORDER BY CreatedAt DESC");
    res.json(rows.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db_error" });
  }
}
