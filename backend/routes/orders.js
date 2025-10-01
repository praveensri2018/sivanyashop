// backend/routes/orders.js
// => PLACE: backend/routes/orders.js
const express = require("express");
const router = express.Router();
const { sql, query } = require("../lib/db");
const requireAuth = require("../middleware/requireAuth");

// GET /api/orders  (list of user's orders or admin sees all)
router.get("/", requireAuth(), async (req, res) => {
  try {
    const user = req.user;
    if (user.role === "ADMIN") {
      const r = await query("SELECT * FROM dbo.Orders");
      return res.json(r.recordset);
    } else {
      const r = await query("SELECT * FROM dbo.Orders WHERE UserId = @uid", {
        uid: { type: sql.Int, value: user.userId }
      });
      return res.json(r.recordset);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
