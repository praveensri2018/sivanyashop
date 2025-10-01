// backend/routes/admin/index.js
// => PLACE: backend/routes/admin/index.js
const express = require("express");
const router = express.Router();
const requireAuth = require("../../middleware/requireAuth");

// placeholder admin route
router.get("/ping", requireAuth("ADMIN"), (req, res) => {
  res.json({ ok: true, admin: true });
});

module.exports = router;
