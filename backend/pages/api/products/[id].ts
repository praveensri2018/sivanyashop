// backend/pages/api/products/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "id_required" });
  const pool = await getPool();
  const prod = await pool.request().input("Id", Number(id)).query("SELECT * FROM dbo.Products WHERE Id = @Id");
  if (!prod.recordset[0]) return res.status(404).json({ error: "not_found" });
  const variants = await pool.request().input("ProductId", Number(id)).query("SELECT * FROM dbo.ProductVariants WHERE ProductId = @ProductId");
  res.json({ product: prod.recordset[0], variants: variants.recordset });
}
