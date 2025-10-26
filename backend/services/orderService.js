// Place file at: backend/services/orderService.js
// Full order service layer. Uses orderRepo + cartRepo. Defensive total calc + logging.

const orderRepo = require('../repositories/orderRepo');
const cartRepo = require('../repositories/cartRepo');

const { query, sql } = require('../lib/db');

async function createOrderFromCart({ userId, retailerId, shippingAddressId, cartItems = [], paymentGatewayOrderId, paymentGatewayPaymentId }) {
  // Defensive: ensure cartItems is array
  const items = Array.isArray(cartItems) ? cartItems : [];

  // Calculate total amount defensively
  const totalAmount = items.reduce((total, item) => {
    const price = Number(item.Price ?? item.price ?? 0);
    const qty = Number(item.Qty ?? item.qty ?? 1);
    return total + (price * qty);
  }, 0);

  // ensure we pass a JS Number with 2 decimal places
  const totalToSend = Number(totalAmount.toFixed(2));

  // Create order - MAKE SURE THIS RETURNS THE CREATED ORDER
  const order = await orderRepo.createOrder({
    userId,
    retailerId: retailerId || null,
    shippingAddressId: shippingAddressId || null,
    totalAmount: totalToSend,
    status: 'CONFIRMED',
    paymentStatus: 'PAID'
  });

  // Safety check
  if (!order || !order.Id) {
    throw new Error('Order repository did not return order with Id');
  }

  // Add order items
  for (const item of items) {
    await orderRepo.createOrderItem({
      orderId: order.Id,
      productId: item.ProductId ?? item.productId,
      variantId: item.VariantId ?? item.variantId,
      qty: item.Qty ?? item.qty ?? 1,
      price: item.Price ?? item.price ?? 0
    });
  }

  // Update order with payment gateway references if needed
  if (paymentGatewayOrderId || paymentGatewayPaymentId) {
    await orderRepo.updateOrderPaymentReferences(order.Id, paymentGatewayOrderId, paymentGatewayPaymentId);
  }

  // Return created order object
  return order;
}

async function createFailedOrder({ userId, paymentGatewayOrderId, paymentGatewayPaymentId, status = 'FAILED', paymentStatus = 'FAILED' }) {
  const order = await orderRepo.createOrder({
    userId,
    totalAmount: 0,
    status,
    paymentStatus
  });

  if (paymentGatewayOrderId || paymentGatewayPaymentId) {
    await orderRepo.updateOrderPaymentReferences(order.Id, paymentGatewayOrderId, paymentGatewayPaymentId);
  }

  return order;
}

async function createPaymentRecord({ orderId, amount, method, paymentGateway, transactionRef, status }) {
  return await orderRepo.createPayment({
    orderId,
    amount,
    method,
    paymentGateway,
    transactionRef,
    status
  });
}

async function updateStockForOrder(orderId) {
  const orderItems = await orderRepo.getOrderItems(orderId);
  
  for (const item of orderItems) {
    // Update stock ledger for each item
    await orderRepo.createStockLedgerEntry({
      productId: item.ProductId,
      variantId: item.VariantId,
      refOrderId: orderId,
      refOrderItemId: item.Id,
      movementType: 'SALE',
      quantity: -item.Qty // Negative because stock is reducing
    });

    // Update product variant stock quantity
    await orderRepo.updateVariantStock(item.VariantId, -item.Qty);
  }
}

async function clearUserCart(userId) {
  const cart = await cartRepo.getCartByUserId(userId);
  if (cart) {
    await orderRepo.clearCartItems(cart.Id);
  }
}


async function getOrderWithDetails(orderId, userId, userRole) {
  let order;
  
  if (userRole === 'ADMIN') {
    order = await orderRepo.getOrderById(orderId);
  } else if (userRole === 'RETAILER') {
    order = await orderRepo.getOrderByIdForRetailer(orderId, userId);
  } else {
    order = await orderRepo.getOrderByIdForCustomer(orderId, userId);
  }
  
  if (!order) {
    throw { status: 404, message: 'Order not found' };
  }
  
  // Get order items
  order.items = await orderRepo.getOrderItems(orderId);
  
  // Get payment history
  order.payments = await orderRepo.getOrderPayments(orderId);
  
  // Get status history
  order.statusHistory = await orderRepo.getOrderStatusHistory(orderId);
  
  return order;
}

async function updateOrderStatus(orderId, status, notes = '') {
  const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  
  if (!validStatuses.includes(status)) {
    throw { status: 400, message: 'Invalid order status' };
  }
  
  const order = await orderRepo.updateOrderStatus(orderId, status, notes);
  
  // TODO: Trigger notification
  // await notificationService.sendOrderStatusUpdate(orderId, status);
  
  return order;
}

async function requestRefund(orderId, userId, refundData) {
  const order = await orderRepo.getOrderByIdForCustomer(orderId, userId);
  
  if (!order) {
    throw { status: 404, message: 'Order not found' };
  }
  
  if (order.Status !== 'DELIVERED') {
    throw { status: 400, message: 'Refund can only be requested for delivered orders' };
  }
  
  const refund = await orderRepo.createRefundRequest({
    orderId,
    userId,
    reason: refundData.reason,
    items: refundData.items,
    status: 'PENDING'
  });
  
  return refund;
}

async function confirmOrder(orderId, userId, userRole) {
  // Get order with details
  const order = await getOrderWithDetails(orderId, userId, userRole);
  
  if (!order) {
    throw { status: 404, message: 'Order not found' };
  }
  
  // Check if order can be confirmed (pending or confirmed status)
  if (order.Status !== 'PENDING' && order.Status !== 'CONFIRMED') {
    throw { status: 400, message: 'Order cannot be confirmed in current status' };
  }
  
  // Update order status to CONFIRMED
  const updatedOrder = await orderRepo.updateOrderStatus(orderId, 'CONFIRMED', 'Order confirmed by customer');
  
  return {
    ...updatedOrder,
    items: order.items || [],
    shippingAddress: order.shippingAddress
  };
}

// Add these functions to your existing orderService.js

async function getUserOrderHistory(userId, options = {}) {
  const { page = 1, limit = 10, status, paymentStatus } = options;
  const offset = (page - 1) * limit;
  
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
  
  if (paymentStatus) {
    whereClause += ' AND o.PaymentStatus = @paymentStatus';
    params.paymentStatus = { type: sql.NVarChar, value: paymentStatus };
  }

  const result = await query(`
    SELECT 
      o.Id, o.Id, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
      COUNT(*) OVER() as TotalCount,
      (SELECT COUNT(*) FROM dbo.OrderItems WHERE OrderId = o.Id) as ItemsCount
    FROM dbo.Orders o
    ${whereClause}
    ORDER BY o.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  const total = result.recordset[0]?.TotalCount || 0;
  
  return {
    orders: result.recordset.map(order => ({
      id: order.Id,
      orderNumber: order.OrderNumber,
      status: order.Status,
      paymentStatus: order.PaymentStatus,
      totalAmount: order.TotalAmount,
      createdAt: order.CreatedAt,
      itemsCount: order.ItemsCount
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getAdminOrderHistory(options = {}) {
  const { page = 1, limit = 10, status, paymentStatus, userId } = options;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  const params = {
    offset: { type: sql.Int, value: offset },
    limit: { type: sql.Int, value: limit }
  };

  if (status) {
    whereClause += ' AND o.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }
  
  if (paymentStatus) {
    whereClause += ' AND o.PaymentStatus = @paymentStatus';
    params.paymentStatus = { type: sql.NVarChar, value: paymentStatus };
  }
  
  if (userId) {
    whereClause += ' AND o.UserId = @userId';
    params.userId = { type: sql.Int, value: userId };
  }

  const result = await query(`
    SELECT 
      o.Id, o.id OrderNumber, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
      u.Id as UserId, u.Name as UserName, u.Email as UserEmail,
      COUNT(*) OVER() as TotalCount,
      (SELECT COUNT(*) FROM dbo.OrderItems WHERE OrderId = o.Id) as ItemsCount
    FROM dbo.Orders o
    LEFT JOIN dbo.Users u ON o.UserId = u.Id
    ${whereClause}
    ORDER BY o.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  const total = result.recordset[0]?.TotalCount || 0;
  
  return {
    orders: result.recordset.map(order => ({
      id: order.Id,
      orderNumber: order.OrderNumber,
      status: order.Status,
      paymentStatus: order.PaymentStatus,
      totalAmount: order.TotalAmount,
      createdAt: order.CreatedAt,
      itemsCount: order.ItemsCount,
      user: {
        id: order.UserId,
        name: order.UserName,
        email: order.UserEmail
      }
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}


module.exports = {
  createOrderFromCart,
  createFailedOrder,
  createPaymentRecord,
  updateStockForOrder,
  clearUserCart,
  getUserOrderHistory,getOrderWithDetails,updateOrderStatus,requestRefund,confirmOrder,getAdminOrderHistory

};
