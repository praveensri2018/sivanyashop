// backend/routes/products.js
// => PLACE: backend/routes/products.js
const express = require("express");
const router = express.Router();
const { sql, query } = require("../lib/db");

// GET /api/products  (list)
router.get("/", async (req, res) => {
  try {
    const q = `SELECT Id, Name, Description, ImagePath, IsActive FROM dbo.Products WHERE IsActive = 1`;
    const r = await query(q);
    return res.json({ rows: r.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const p = await query("SELECT * FROM dbo.Products WHERE Id = @id", {
      id: { type: sql.Int, value: id }
    });
    if (!p.recordset.length) return res.status(404).json({ error: "not found" });
    // you can join variants etc. later
    return res.json(p.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
