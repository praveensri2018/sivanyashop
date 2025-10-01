// backend/middleware/requireAuth.js
// => PLACE: backend/middleware/requireAuth.js
const { verifyJwt } = require("../lib/auth");

function requireAuth(role) {
  return (req, res, next) => {
    try {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: "missing authorization header" });
      const token = auth.split(" ")[1];
      const payload = verifyJwt(token);
      req.user = payload;
      if (role && payload.role !== role) {
        return res.status(403).json({ error: "forbidden" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: "invalid token" });
    }
  };
}

module.exports = requireAuth;
