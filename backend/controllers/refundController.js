// backend/controllers/refundController.js
const refundService = require('../services/refundService');

// 🔹 CUSTOMER CONTROLLERS
async function getMyRefundRequests(req, res, next) {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const refunds = await refundService.getMyRefundRequests(userId, { 
      status, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    
    res.json({ 
      success: true, 
      refunds: refunds.requests,
      pagination: refunds.pagination
    });
  } catch (err) { 
    next(err); 
  }
}

async function createRefundRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const { orderId, reason, items, amount } = req.body;
    
    if (!orderId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID and reason are required' 
      });
    }
    
    const refund = await refundService.createRefundRequest({
      orderId: parseInt(orderId),
      userId,
      reason,
      items: items || [],
      amount: amount || null
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Refund request submitted successfully',
      refund 
    });
  } catch (err) { 
    next(err); 
  }
}

async function getMyRefundDetails(req, res, next) {
  try {
    const refundId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const refund = await refundService.getMyRefundDetails(refundId, userId);
    res.json({ success: true, refund });
  } catch (err) { 
    next(err); 
  }
}

// 🔹 RETAILER CONTROLLERS
async function getRetailerRefundRequests(req, res, next) {
  try {
    const retailerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const refunds = await refundService.getRetailerRefundRequests(retailerId, { 
      status, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    
    res.json({ 
      success: true, 
      refunds: refunds.requests,
      pagination: refunds.pagination
    });
  } catch (err) { 
    next(err); 
  }
}

async function updateRefundStatus(req, res, next) {
  try {
    const refundId = parseInt(req.params.id);
    const retailerId = req.user.id;
    const { status, notes } = req.body; // status: 'APPROVED', 'REJECTED'
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status must be APPROVED or REJECTED' 
      });
    }
    
    const refund = await refundService.updateRefundStatus(refundId, retailerId, status, notes);
    
    res.json({ 
      success: true, 
      message: `Refund request ${status.toLowerCase()} successfully`,
      refund 
    });
  } catch (err) { 
    next(err); 
  }
}

// 🔹 ADMIN CONTROLLERS
async function getAllRefundRequests(req, res, next) {
  try {
    const { status, page = 1, limit = 20, userId, retailerId } = req.query;
    
    const refunds = await refundService.getAllRefundRequests({ 
      status, 
      page: parseInt(page), 
      limit: parseInt(limit),
      userId: userId ? parseInt(userId) : null,
      retailerId: retailerId ? parseInt(retailerId) : null
    });
    
    res.json({ 
      success: true, 
      refunds: refunds.requests,
      pagination: refunds.pagination
    });
  } catch (err) { 
    next(err); 
  }
}

async function getRefundDetails(req, res, next) {
  try {
    const refundId = parseInt(req.params.id);
    
    const refund = await refundService.getRefundDetails(refundId);
    res.json({ success: true, refund });
  } catch (err) { 
    next(err); 
  }
}

async function processRefund(req, res, next) {
  try {
    const refundId = parseInt(req.params.id);
    const adminId = req.user.id;
    const { action, paymentNotes } = req.body; // action: 'COMPLETE', 'REJECT'
    
    if (!['COMPLETE', 'REJECT'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Action must be COMPLETE or REJECT' 
      });
    }
    
    const result = await refundService.processRefund(refundId, adminId, action, paymentNotes);
    
    res.json({ 
      success: true, 
      message: result.message,
      refund: result.refund
    });
  } catch (err) { 
    next(err); 
  }
}

async function getRefundStats(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await refundService.getRefundStats({ startDate, endDate });
    res.json({ success: true, stats });
  } catch (err) { 
    next(err); 
  }
}

module.exports = {
  // Customer
  getMyRefundRequests,
  createRefundRequest,
  getMyRefundDetails,
  
  // Retailer
  getRetailerRefundRequests,
  updateRefundStatus,
  
  // Admin
  getAllRefundRequests,
  getRefundDetails,
  processRefund,
  getRefundStats
};