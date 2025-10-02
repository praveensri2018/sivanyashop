// => PLACE: backend/controllers/authController.js
const authService = require('../services/authService');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const data = await authService.login(email, password);
    res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
}

// Public registration (Customer)
async function registerCustomer(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success: false, message: 'Name, email, password required' });

    const data = await authService.register({ name, email, password, role: 'CUSTOMER' });
    res.status(201).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

// Admin registration (Retailer)
async function registerRetailer(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success: false, message: 'Name, email, password required' });

    const data = await authService.register({ name, email, password, role: 'RETAILER' });
    res.status(201).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

module.exports = { login, registerCustomer, registerRetailer };
