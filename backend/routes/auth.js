// backend/routes/auth.js
// => PLACE: backend/routes/auth.js
const express = require("express");
const router = express.Router();
const { createUser, verifyPassword, signJwt, verifyJwt } = require("../lib/auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const user = await createUser({ name, email, password });
    const token = signJwt({ userId: user.Id, role: user.Role });
    return res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await verifyPassword(email, password);
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    const token = signJwt({ userId: user.id, role: user.role });
    return res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "missing token" });
    const token = auth.split(" ")[1];
    const payload = verifyJwt(token);
    // return minimal payload
    return res.json({ userId: payload.userId, role: payload.role });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "invalid token" });
  }
});

module.exports = router;
