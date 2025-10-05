// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
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

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-images', productImageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stock', stockRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
