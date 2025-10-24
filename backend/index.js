// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
/*
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
};*/

const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);  // remove empty strings

const corsOptions = {
  origin: function (origin, callback) {
    // <-- handle no-origin requests (like curl or mobile native)
    if (!origin) return callback(null, true);

    // <-- check if origin is in the list from .env
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);  // allowed
    }

    // <-- reject anything else (will show CORS error in browser)
    return callback(new Error('CORS not allowed for origin: ' + origin), false);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'], // <-- allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // <-- allowed headers
  credentials: true,          // <-- allow cookies / auth headers
  optionsSuccessStatus: 204   // <-- preflight success status
};

// CORS (preflight included by default)
app.use(cors(corsOptions));
// If you want explicit preflight handling, uncomment one of these:
// app.options('/api/*', cors(corsOptions)); // Express 5-safe
// app.options('/*', cors(corsOptions));     // Express 5-safe

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');   
const productRoutes = require('./routes/product');
const productImageRoutes = require('./routes/productImage');
const categoryRoutes = require('./routes/category');
const stockRoutes = require('./routes/stock');
const retailerRoutes = require('./routes/retailer');

const cartRoutes = require('./routes/cartRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-images', productImageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentsRoutes); 

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    // Attach rawBody only when body exists (buf may be empty for GET)
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    } else {
      req.rawBody = '';
    }
  }
}));
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
