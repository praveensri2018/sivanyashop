// backend/controllers/reportController.js
const reportService = require('../services/reportService');

async function getSalesReport(req, res, next) {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const report = await reportService.generateSalesReport({ startDate, endDate, groupBy });
    res.json({ success: true, report });
  } catch (err) { next(err); }
}

async function getStockReport(req, res, next) {
  try {
    const { lowStockThreshold = 10 } = req.query;
    
    const report = await reportService.generateStockReport(lowStockThreshold);
    res.json({ success: true, report });
  } catch (err) { next(err); }
}

async function getCustomerReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await reportService.generateCustomerReport({ startDate, endDate });
    res.json({ success: true, report });
  } catch (err) { next(err); }
}

module.exports = {
  getSalesReport,
  getStockReport,
  getCustomerReport
};