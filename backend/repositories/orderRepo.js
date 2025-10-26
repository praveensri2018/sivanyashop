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


async function getOrdersByUser(userId, options = {}) {
  const { offset = 0, limit = 10, status = '' } = options;
  
  let whereClause = 'WHERE o.UserId = @userId';
  const params = {
    userId: { type: sql.Int, value: userId },
    offset: { type: sql.Int, value: offset },
    limit: { type: sql.Int, value: limit }
  };

  if (status) {
    whereClause += ' AND o.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  const result = await query(`
    SELECT 
      o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
      COUNT(oi.Id) as ItemsCount,
      ua.AddressLine1, ua.City, ua.State
    FROM dbo.Orders o
    LEFT JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    LEFT JOIN dbo.UserAddresses ua ON o.ShippingAddressId = ua.Id
    ${whereClause}
    GROUP BY o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
             ua.AddressLine1, ua.City, ua.State
    ORDER BY o.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as Total
    FROM dbo.Orders o
    ${whereClause}
  `, params);

  return {
    orders: result.recordset,
    total: countResult.recordset[0].Total
  };
}

async function getOrderById(orderId) {
  const result = await query(`
    SELECT 
      o.*,
      u.Name as UserName, u.Email as UserEmail,
      ua.*
    FROM dbo.Orders o
    INNER JOIN dbo.Users u ON o.UserId = u.Id
    LEFT JOIN dbo.UserAddresses ua ON o.ShippingAddressId = ua.Id
    WHERE o.Id = @orderId
  `, { orderId: { type: sql.Int, value: orderId } });

  return result.recordset[0];
}

async function getOrderByIdForCustomer(orderId, userId) {
  const result = await query(`
    SELECT 
      o.*,
      ua.*
    FROM dbo.Orders o
    LEFT JOIN dbo.UserAddresses ua ON o.ShippingAddressId = ua.Id
    WHERE o.Id = @orderId AND o.UserId = @userId
  `, {
    orderId: { type: sql.Int, value: orderId },
    userId: { type: sql.Int, value: userId }
  });

  return result.recordset[0];
}

async function getOrderByIdForRetailer(orderId, retailerId) {
  const result = await query(`
    SELECT 
      o.*,
      u.Name as UserName, u.Email as UserEmail,
      ua.*
    FROM dbo.Orders o
    INNER JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    INNER JOIN dbo.ProductVariants pv ON oi.VariantId = pv.Id
    INNER JOIN dbo.Products p ON pv.ProductId = p.Id
    INNER JOIN dbo.Users u ON o.UserId = u.Id
    LEFT JOIN dbo.UserAddresses ua ON o.ShippingAddressId = ua.Id
    WHERE o.Id = @orderId AND p.CreatedById = @retailerId
  `, {
    orderId: { type: sql.Int, value: orderId },
    retailerId: { type: sql.Int, value: retailerId }
  });

  return result.recordset[0];
}

async function getOrderItems(orderId) {
  const result = await query(`
    SELECT 
      oi.*,
      p.Name as ProductName,
      pv.VariantName,
      pv.Attributes,
      pi.ImageUrl
    FROM dbo.OrderItems oi
    INNER JOIN dbo.Products p ON oi.ProductId = p.Id
    INNER JOIN dbo.ProductVariants pv ON oi.VariantId = pv.Id
    LEFT JOIN dbo.ProductImages pi ON p.Id = pi.ProductId AND pi.IsPrimary = 1
    WHERE oi.OrderId = @orderId
  `, { orderId: { type: sql.Int, value: orderId } });

  return result.recordset;
}

async function getOrderPayments(orderId) {
  const result = await query(`
    SELECT *
    FROM dbo.Payments
    WHERE OrderId = @orderId
    ORDER BY CreatedAt DESC
  `, { orderId: { type: sql.Int, value: orderId } });

  return result.recordset;
}

async function getOrderStatusHistory(orderId) {
  const result = await query(`
    SELECT *
    FROM dbo.OrderStatusHistory
    WHERE OrderId = @orderId
    ORDER BY CreatedAt DESC
  `, { orderId: { type: sql.Int, value: orderId } });

  return result.recordset;
}

async function updateOrderStatus(orderId, status, notes = '') {
  // Update order status
  await query(`
    UPDATE dbo.Orders 
    SET Status = @status
    WHERE Id = @orderId
  `, {
    orderId: { type: sql.Int, value: orderId },
    status: { type: sql.NVarChar, value: status }
  });

  // Add to status history
  await query(`
    INSERT INTO dbo.OrderStatusHistory (OrderId, Status, Notes)
    VALUES (@orderId, @status, @notes)
  `, {
    orderId: { type: sql.Int, value: orderId },
    status: { type: sql.NVarChar, value: status },
    notes: { type: sql.NVarChar, value: notes }
  });

  return getOrderById(orderId);
}

async function createRefundRequest(refundData) {
  const result = await query(`
    INSERT INTO dbo.RefundRequests (OrderId, UserId, Reason, Status, Amount)
    OUTPUT INSERTED.*
    VALUES (@orderId, @userId, @reason, @status, @amount)
  `, {
    orderId: { type: sql.Int, value: refundData.orderId },
    userId: { type: sql.Int, value: refundData.userId },
    reason: { type: sql.NVarChar, value: refundData.reason },
    status: { type: sql.NVarChar, value: refundData.status },
    amount: { type: sql.Decimal, value: refundData.amount }
  });

  return result.recordset[0];
}

async function getAdminOrders(filters = {}) {
  const { status = '', startDate = '', endDate = '', retailerId = '' } = filters;
  
  let whereClause = 'WHERE 1=1';
  const params = {};

  if (status) {
    whereClause += ' AND o.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  if (startDate) {
    whereClause += ' AND o.CreatedAt >= @startDate';
    params.startDate = { type: sql.DateTime, value: new Date(startDate) };
  }

  if (endDate) {
    whereClause += ' AND o.CreatedAt <= @endDate';
    params.endDate = { type: sql.DateTime, value: new Date(endDate) };
  }

  if (retailerId) {
    whereClause += ' AND p.CreatedById = @retailerId';
    params.retailerId = { type: sql.Int, value: parseInt(retailerId) };
  }

  const result = await query(`
    SELECT 
      o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
      u.Name as UserName, u.Email as UserEmail,
      COUNT(oi.Id) as ItemsCount
    FROM dbo.Orders o
    INNER JOIN dbo.Users u ON o.UserId = u.Id
    LEFT JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    LEFT JOIN dbo.Products p ON oi.ProductId = p.Id
    ${whereClause}
    GROUP BY o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
             u.Name, u.Email
    ORDER BY o.CreatedAt DESC
  `, params);

  return result.recordset;
}

async function getOrderStats() {
  const result = await query(`
    SELECT 
      COUNT(*) as TotalOrders,
      SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as PendingOrders,
      SUM(CASE WHEN Status = 'DELIVERED' THEN 1 ELSE 0 END) as DeliveredOrders,
      SUM(TotalAmount) as TotalRevenue
    FROM dbo.Orders
    WHERE Status != 'CANCELLED'
  `);

  return result.recordset[0];
}

async function getRetailerOrders(retailerId, filters = {}) {
  const { status = '', startDate = '', endDate = '' } = filters;
  
  let whereClause = 'WHERE p.CreatedById = @retailerId';
  const params = {
    retailerId: { type: sql.Int, value: retailerId }
  };

  if (status) {
    whereClause += ' AND o.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  if (startDate) {
    whereClause += ' AND o.CreatedAt >= @startDate';
    params.startDate = { type: sql.DateTime, value: new Date(startDate) };
  }

  if (endDate) {
    whereClause += ' AND o.CreatedAt <= @endDate';
    params.endDate = { type: sql.DateTime, value: new Date(endDate) };
  }

  const result = await query(`
    SELECT 
      o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
      u.Name as UserName, u.Email as UserEmail,
      COUNT(DISTINCT oi.Id) as ItemsCount
    FROM dbo.Orders o
    INNER JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    INNER JOIN dbo.Products p ON oi.ProductId = p.Id
    INNER JOIN dbo.Users u ON o.UserId = u.Id
    ${whereClause}
    GROUP BY o.Id, o.OrderNumber, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
             u.Name, u.Email
    ORDER BY o.CreatedAt DESC
  `, params);

  return result.recordset;
}

async function getRefundRequests(filters = {}) {
  const { status = '' } = filters;
  
  let whereClause = 'WHERE 1=1';
  const params = {};

  if (status) {
    whereClause += ' AND rr.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  const result = await query(`
    SELECT 
      rr.*,
      o.OrderNumber, o.TotalAmount,
      u.Name as UserName, u.Email as UserEmail
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    ${whereClause}
    ORDER BY rr.CreatedAt DESC
  `, params);

  return result.recordset;
}

async function updateOrderStatus(orderId, status, notes = null) {
  const result = await query(
    `UPDATE dbo.Orders 
     SET Status = @status, 
         UpdatedAt = SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time'
     OUTPUT INSERTED.*
     WHERE Id = @orderId`,
    {
      orderId: { type: sql.Int, value: orderId },
      status: { type: sql.NVarChar, value: status },
      notes: { type: sql.NVarChar, value: notes }
    }
  );
  
  if (!result.recordset || result.recordset.length === 0) {
    throw new Error('Order not found');
  }
  
  return result.recordset[0];
}


module.exports = {
  createOrder,
  createOrderItem,
  createPayment,
  updateOrderPaymentReferences,
  getOrderItems,
  createStockLedgerEntry,
  updateVariantStock,
  clearCartItems,
  updateOrderStatus,
  getOrderById,
  getOrderByIdForRetailer,
getRefundRequests,
getRetailerOrders,
getOrderByIdForCustomer,
getOrderPayments,
getOrderStatusHistory
};