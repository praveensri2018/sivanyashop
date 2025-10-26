// backend/controllers/orderController.js
const orderService = require('../services/orderService');

async function getOrderHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const orders = await orderService.getUserOrderHistory(userId, { page, limit, status });
    res.json({ success: true, ...orders });
  } catch (err) { next(err); }
}

async function getOrderDetails(req, res, next) {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const order = await orderService.getOrderWithDetails(orderId, userId, userRole);
    res.json({ success: true, order });
  } catch (err) { next(err); }
}

async function updateOrderStatus(req, res, next) {
  try {
    const orderId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    const order = await orderService.updateOrderStatus(orderId, status, notes);
    res.json({ success: true, order });
  } catch (err) { next(err); }
}

async function requestRefund(req, res, next) {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const { reason, items } = req.body;
    
    const refund = await orderService.requestRefund(orderId, userId, { reason, items });
    res.json({ success: true, refund });
  } catch (err) { next(err); }
}

async function getOrderReports(req, res, next) {
  try {
    const { startDate, endDate, status, retailerId } = req.query;
    
    const reports = await orderService.generateOrderReports({ 
      startDate, endDate, status, retailerId 
    });
    res.json({ success: true, reports });
  } catch (err) { next(err); }
}



async function confirmOrder(req, res, next) {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const order = await orderService.confirmOrder(orderId, userId, userRole);
    res.json({ 
      success: true, 
      message: 'Order confirmed successfully',
      order 
    });
  } catch (err) { 
    next(err); 
  }
}



module.exports = {
  getOrderHistory,
  getOrderDetails,
  updateOrderStatus,
  requestRefund,
  getOrderReports,
  confirmOrder
};