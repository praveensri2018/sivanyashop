// backend/routes/cart.js
// => PLACE: backend/routes/cart.js
const express = require("express");
const router = express.Router();
const { sql, query } = require("../lib/db");
const requireAuth = require("../middleware/requireAuth");

// GET /api/cart  (user's cart)
router.get("/", requireAuth(), async (req, res) => {
  try {
    const userId = req.user.userId;
    const c = await query("SELECT * FROM dbo.Carts WHERE UserId = @uid", {
      uid: { type: sql.Int, value: userId }
    });
    if (!c.recordset.length) return res.json({ cart: null });
    const cart = c.recordset[0];
    const items = await query("SELECT * FROM dbo.CartItems WHERE CartId = @cartId", {
      cartId: { type: sql.Int, value: cart.Id }
    });
    return res.json({ cart, items: items.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /api/cart/add-item
router.post("/add-item", requireAuth(), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, variantId, qty = 1, price } = req.body;
    // find or create cart
    let c = await query("SELECT Id FROM dbo.Carts WHERE UserId = @uid", {
      uid: { type: sql.Int, value: userId }
    });
    let cartId;
    if (!c.recordset.length) {
      const ins = await query(
        `INSERT INTO dbo.Carts (UserId) OUTPUT INSERTED.Id VALUES (@uid)`,
        { uid: { type: sql.Int, value: userId } }
      );
      cartId = ins.recordset[0].Id;
    } else {
      cartId = c.recordset[0].Id;
    }
    // insert item
    await query(
      `INSERT INTO dbo.CartItems (CartId, ProductId, VariantId, Qty, Price) VALUES (@cartId, @prod, @var, @qty, @price)`,
      {
        cartId: { type: sql.Int, value: cartId },
        prod: { type: sql.Int, value: productId },
        var: { type: sql.Int, value: variantId },
        qty: { type: sql.Int, value: qty },
        price: { type: sql.Decimal(18, 2), value: price }
      }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
