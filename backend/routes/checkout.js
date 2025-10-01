// backend/routes/checkout.js
// => PLACE: backend/routes/checkout.js
const express = require("express");
const router = express.Router();
const { sql, query } = require("../lib/db");
const requireAuth = require("../middleware/requireAuth");

// POST /api/checkout/create-order
router.post("/create-order", requireAuth(), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddressId } = req.body;

    // fetch cart
    const cartRes = await query("SELECT Id FROM dbo.Carts WHERE UserId = @uid", {
      uid: { type: sql.Int, value: userId }
    });
    if (!cartRes.recordset.length) return res.status(400).json({ error: "cart empty" });
    const cartId = cartRes.recordset[0].Id;
    const items = await query("SELECT * FROM dbo.CartItems WHERE CartId = @cartId", {
      cartId: { type: sql.Int, value: cartId }
    });

    // compute total
    let total = 0;
    items.recordset.forEach(i => (total += parseFloat(i.Price) * i.Qty));

    // create order (transaction would be better; keep simple)
    const insOrder = await query(
      `INSERT INTO dbo.Orders (UserId, ShippingAddressId, TotalAmount) OUTPUT INSERTED.Id VALUES (@uid, @addr, @total)`,
      {
        uid: { type: sql.Int, value: userId },
        addr: { type: sql.Int, value: shippingAddressId || null },
        total: { type: sql.Decimal(18, 2), value: total }
      }
    );
    const orderId = insOrder.recordset[0].Id;

    // create order items
    const promises = items.recordset.map(it =>
      query(
        `INSERT INTO dbo.OrderItems (OrderId, ProductId, VariantId, Qty, Price) VALUES (@oid, @pid, @vid, @qty, @price)`,
        {
          oid: { type: sql.Int, value: orderId },
          pid: { type: sql.Int, value: it.ProductId },
          vid: { type: sql.Int, value: it.VariantId },
          qty: { type: sql.Int, value: it.Qty },
          price: { type: sql.Decimal(18, 2), value: it.Price }
        }
      )
    );
    await Promise.all(promises);

    // optional: clear cart
    await query("DELETE FROM dbo.CartItems WHERE CartId = @cartId", {
      cartId: { type: sql.Int, value: cartId }
    });

    res.json({ ok: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
