const { verify } = require('../utils/jwt');

function verifyToken(req, res, next) {
  try {
    // Accept Authorization header: "Bearer <token>"
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token;

    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
      } else {
        // sometimes clients send token directly
        token = parts[0];
      }
    }

    // optional: accept token via query ?token= or cookie (if you use cookies)
    if (!token && req.query && req.query.token) token = req.query.token;
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing token' });
    }

    const payload = verify(token); // throws if invalid/expired
    req.user = payload;
    next();
  } catch (err) {
    console.error('authMiddleware verifyToken error:', err && err.message ? err.message : err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

module.exports = { verifyToken, ensureAdmin };
