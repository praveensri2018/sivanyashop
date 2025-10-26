// Create new file: controllers/paymentHistoryController.js
const paymentHistoryService = require('../services/paymentHistoryService');

async function getPaymentHistory(req, res, next) {
  try {
    const user = req.user;
    const { page = 1, limit = 10, status } = req.query;
    
    let payments;
    if (user.role === 'ADMIN') {
      payments = await paymentHistoryService.getAdminPaymentHistory({ 
        page: parseInt(page), 
        limit: parseInt(limit),
        status,
        userId: req.query.userId ? parseInt(req.query.userId) : undefined
      });
    } else {
      payments = await paymentHistoryService.getUserPaymentHistory(user.id, { 
        page: parseInt(page), 
        limit: parseInt(limit) 
      });
    }
    
    res.json({ 
      success: true, 
      payments: payments.payments,
      pagination: payments.pagination
    });
  } catch (err) {
    next(err);
  }
}

async function getPaymentDetails(req, res, next) {
  try {
    const paymentId = parseInt(req.params.id);
    const user = req.user;
    
    const payment = await paymentHistoryService.getPaymentDetails(
      paymentId, 
      user.id, 
      user.role
    );
    
    res.json({ 
      success: true, 
      payment 
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPaymentHistory,
  getPaymentDetails
};