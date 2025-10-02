// => PLACE: backend/middleware/authMiddleware.js
const { verify } = require('../utils/jwt');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Missing token' });

  try {
    const payload = verify(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Admin-only routes
function ensureAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
}

module.exports = { verifyToken, ensureAdmin };
