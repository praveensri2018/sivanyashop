// PLACE: backend/controllers/retailerController.js
const retailerService = require('../services/retailerService');

async function listRetailers(req, res, next) {
  try {
    const rows = await retailerService.getAllRetailers();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function getRetailer(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await retailerService.getRetailerById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

async function createRetailer(req, res, next) {
  try {
    const { name, email, password, isActive } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'email & password required' });

    const created = await retailerService.createRetailer({ name, email, password, isActive });
    res.json({ success: true, retailer: created });
  } catch (err) { next(err); }
}

async function updateRetailer(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, email, password, isActive } = req.body;
    const updated = await retailerService.updateRetailer(id, { name, email, password, isActive });
    res.json({ success: true, retailer: updated });
  } catch (err) { next(err); }
}

async function deleteRetailer(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await retailerService.deleteRetailer(id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = {
  listRetailers, getRetailer, createRetailer, updateRetailer, deleteRetailer
};
