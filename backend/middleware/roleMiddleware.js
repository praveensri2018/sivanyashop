// backend/middleware/roleMiddleware.js
function ensureAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function ensureRetailer(req, res, next) {
  if (req.user.role !== 'RETAILER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Retailer access required' });
  }
  next();
}

function ensureCustomer(req, res, next) {
  if (req.user.role !== 'CUSTOMER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Customer access required' });
  }
  next();
}

module.exports = { ensureAdmin, ensureRetailer, ensureCustomer };