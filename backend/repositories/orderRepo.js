const { query, sql } = require('../lib/db');

async function createOrder({ userId, retailerId = null, shippingAddressId = null, totalAmount, status = 'PENDING', paymentStatus = 'PENDING' }) {
  const result = await query(
    `INSERT INTO dbo.Orders (UserId, RetailerId, ShippingAddressId, Status, PaymentStatus, TotalAmount, CreatedAt)
     OUTPUT INSERTED.*
     VALUES (@userId, @retailerId, @shippingAddressId, @status, @paymentStatus, @totalAmount, SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time')`,
    {
      userId: { type: sql.Int, value: userId },
      retailerId: { type: sql.Int, value: retailerId },
      shippingAddressId: { type: sql.Int, value: shippingAddressId },
      status: { type: sql.NVarChar, value: status },
      paymentStatus: { type: sql.NVarChar, value: paymentStatus },
      totalAmount: { type: sql.Decimal, value: totalAmount }
    }
  );
  return result.recordset[0];
}

async function createOrderItem({ orderId, productId, variantId, qty, price }) {
  const result = await query(
    `INSERT INTO dbo.OrderItems (OrderId, ProductId, VariantId, Qty, Price, CreatedAt)
     OUTPUT INSERTED.*
     VALUES (@orderId, @productId, @variantId, @qty, @price, SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time')`,
    {
      orderId: { type: sql.Int, value: orderId },
      productId: { type: sql.Int, value: productId },
      variantId: { type: sql.Int, value: variantId },
      qty: { type: sql.Int, value: qty },
      price: { type: sql.Decimal, value: price }
    }
  );
  return result.recordset[0];
}

async function createPayment({ orderId, amount, method, paymentGateway, transactionRef, status }) {
  const result = await query(
    `INSERT INTO dbo.Payments (OrderId, Amount, Method, PaymentGateway, TransactionRef, Status, CreatedAt)
     OUTPUT INSERTED.*
     VALUES (@orderId, @amount, @method, @paymentGateway, @transactionRef, @status, SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time')`,
    {
      orderId: { type: sql.Int, value: orderId },
      amount: { type: sql.Decimal, value: amount },
      method: { type: sql.NVarChar, value: method },
      paymentGateway: { type: sql.NVarChar, value: paymentGateway },
      transactionRef: { type: sql.NVarChar, value: transactionRef },
      status: { type: sql.NVarChar, value: status }
    }
  );
  return result.recordset[0];
}

async function updateOrderPaymentReferences(orderId, paymentGatewayOrderId, paymentGatewayPaymentId) {
  // You might want to add these columns to your Orders table or store in metadata
  await query(
    `UPDATE dbo.Orders 
     SET PaymentGatewayOrderId = @paymentGatewayOrderId, 
         PaymentGatewayPaymentId = @paymentGatewayPaymentId
     WHERE Id = @orderId`,
    {
      orderId: { type: sql.Int, value: orderId },
      paymentGatewayOrderId: { type: sql.NVarChar, value: paymentGatewayOrderId },
      paymentGatewayPaymentId: { type: sql.NVarChar, value: paymentGatewayPaymentId }
    }
  );
}

async function getOrderItems(orderId) {
  const result = await query(
    'SELECT * FROM dbo.OrderItems WHERE OrderId = @orderId',
    { orderId: { type: sql.Int, value: orderId } }
  );
  return result.recordset;
}

async function createStockLedgerEntry({ productId, variantId, refOrderId, refOrderItemId, movementType, quantity }) {
  await query(
    `INSERT INTO dbo.StockLedger (ProductId, VariantId, RefOrderId, RefOrderItemId, MovementType, Quantity, CreatedAt)
     VALUES (@productId, @variantId, @refOrderId, @refOrderItemId, @movementType, @quantity, SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time')`,
    {
      productId: { type: sql.Int, value: productId },
      variantId: { type: sql.Int, value: variantId },
      refOrderId: { type: sql.Int, value: refOrderId },
      refOrderItemId: { type: sql.Int, value: refOrderItemId },
      movementType: { type: sql.NVarChar, value: movementType },
      quantity: { type: sql.Int, value: quantity }
    }
  );
}

async function updateVariantStock(variantId, quantityChange) {
  await query(
    `UPDATE dbo.ProductVariants 
     SET StockQty = StockQty + @quantityChange
     WHERE Id = @variantId`,
    {
      variantId: { type: sql.Int, value: variantId },
      quantityChange: { type: sql.Int, value: quantityChange }
    }
  );
}

async function clearCartItems(cartId) {
  await query(
    'DELETE FROM dbo.CartItems WHERE CartId = @cartId',
    { cartId: { type: sql.Int, value: cartId } }
  );
}

module.exports = {
  createOrder,
  createOrderItem,
  createPayment,
  updateOrderPaymentReferences,
  getOrderItems,
  createStockLedgerEntry,
  updateVariantStock,
  clearCartItems
};