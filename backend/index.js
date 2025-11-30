require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl / native apps
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for origin: ' + origin), false);
  },
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Parse JSON for normal endpoints
app.use(cors(corsOptions));
app.use(express.json()); // <- must be before routes

// Routes (normal)
const authRoutes = require('./routes/auth');   
const productRoutes = require('./routes/product');
const productImageRoutes = require('./routes/productImage');
const categoryRoutes = require('./routes/category');
const stockRoutes = require('./routes/stock');
const retailerRoutes = require('./routes/retailer');

const cartRoutes = require('./routes/cartRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes'); // note: webhook route inside file will use raw body
const shippingAddressRoutes = require('./routes/shippingAddress');

const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const refundRoutes = require('./routes/refundRoutes');
const sizeChartRoutes = require('./routes/sizeChartRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-images', productImageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/shipping-address', shippingAddressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/size-charts', sizeChartRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler (last)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err && err.stack ? err.stack : err);
  // if err came from CORS callback (Error object), include message
  const message = (err && err.message) ? err.message : 'Internal server error';
  res.status(err.status || 500).json({ success: false, message });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
