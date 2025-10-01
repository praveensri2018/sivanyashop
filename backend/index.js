// backend/index.js
// => PLACE: backend/index.js
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// register middleware
app.use(express.json());

// mount routes
const authRoutes = require("./routes/auth"); // backend/routes/auth.js
const productsRoutes = require("./routes/products"); // backend/routes/products.js
const cartRoutes = require("./routes/cart"); // backend/routes/cart.js
const checkoutRoutes = require("./routes/checkout"); // backend/routes/checkout.js
const ordersRoutes = require("./routes/orders"); // backend/routes/orders.js
const adminRoutes = require("./routes/admin"); // backend/routes/admin/index.js

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(port, () => {
  console.log(`🚀 Express server running on http://localhost:${port}`);
});
