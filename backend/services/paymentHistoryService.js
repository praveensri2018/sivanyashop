// FILE: services/paymentHistoryService.js
const { query, sql } = require('../lib/db');

/**
 * 🧾 Get payment history for a specific user
 */
async function getUserPaymentHistory(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  const result = await query(`
    SELECT 
      p.Id,
      p.OrderId,
      p.Amount,
      p.Method,
      p.PaymentGateway,
      p.TransactionRef,
      p.Status AS PaymentStatus,
      p.CreatedAt,
      o.Status AS OrderStatus,
      o.TotalAmount AS OrderAmount,
      o.PaymentGatewayOrderId,
      o.PaymentGatewayPaymentId,
      COUNT(*) OVER() AS TotalCount
    FROM dbo.Payments p
    INNER JOIN dbo.Orders o ON p.OrderId = o.Id
    WHERE o.UserId = @userId
    ORDER BY p.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, {
    userId: { type: sql.Int, value: userId },
    offset: { type: sql.Int, value: offset },
    limit: { type: sql.Int, value: limit }
  });

  const total = result.recordset[0]?.TotalCount || 0;

  return {
    payments: result.recordset.map(p => ({
      id: p.Id,
      orderId: p.OrderId,
      orderStatus: p.OrderStatus,
      amount: parseFloat(p.Amount),
      paymentMethod: p.Method,
      paymentGateway: p.PaymentGateway,
      transactionRef: p.TransactionRef,
      status: p.PaymentStatus,
      createdAt: p.CreatedAt,
      orderAmount: parseFloat(p.OrderAmount),
      paymentGatewayOrderId: p.PaymentGatewayOrderId,
      paymentGatewayPaymentId: p.PaymentGatewayPaymentId
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * 🧾 Admin: get all payments (optionally filter by userId / status)
 */
async function getAdminPaymentHistory(options = {}) {
  const { page = 1, limit = 10, status, userId } = options;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params = {
    offset: { type: sql.Int, value: offset },
    limit: { type: sql.Int, value: limit }
  };

  if (status) {
    whereClause += ' AND p.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  if (userId) {
    whereClause += ' AND o.UserId = @userId';
    params.userId = { type: sql.Int, value: userId };
  }

  const result = await query(`
    SELECT 
      p.Id,
      p.OrderId,
      p.Amount,
      p.Method,
      p.PaymentGateway,
      p.TransactionRef,
      p.Status AS PaymentStatus,
      p.CreatedAt,
      o.Status AS OrderStatus,
      o.TotalAmount AS OrderAmount,
      o.PaymentGatewayOrderId,
      o.PaymentGatewayPaymentId,
      u.Id AS UserId,
      u.Name AS UserName,
      u.Email AS UserEmail,
      COUNT(*) OVER() AS TotalCount
    FROM dbo.Payments p
    INNER JOIN dbo.Orders o ON p.OrderId = o.Id
    LEFT JOIN dbo.Users u ON o.UserId = u.Id
    ${whereClause}
    ORDER BY p.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  const total = result.recordset[0]?.TotalCount || 0;

  return {
    payments: result.recordset.map(p => ({
      id: p.Id,
      orderId: p.OrderId,
      orderStatus: p.OrderStatus,
      amount: parseFloat(p.Amount),
      paymentMethod: p.Method,
      paymentGateway: p.PaymentGateway,
      transactionRef: p.TransactionRef,
      status: p.PaymentStatus,
      createdAt: p.CreatedAt,
      orderAmount: parseFloat(p.OrderAmount),
      paymentGatewayOrderId: p.PaymentGatewayOrderId,
      paymentGatewayPaymentId: p.PaymentGatewayPaymentId,
      user: {
        id: p.UserId,
        name: p.UserName,
        email: p.UserEmail
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

/**
 * 🧾 Get single payment details (User or Admin)
 */
async function getPaymentDetails(paymentId, userId, userRole) {
  let queryStr = `
    SELECT 
      p.Id,
      p.OrderId,
      p.Amount,
      p.Method,
      p.PaymentGateway,
      p.TransactionRef,
      p.Status AS PaymentStatus,
      p.CreatedAt,
      p.CreatedAt as UpdatedAt,
      o.Status AS OrderStatus,
      o.TotalAmount AS OrderAmount,
      o.PaymentGatewayOrderId,
      o.PaymentGatewayPaymentId,
      u.Id AS UserId,
      u.Name AS UserName,
      u.Email AS UserEmail
    FROM dbo.Payments p
    INNER JOIN dbo.Orders o ON p.OrderId = o.Id
    LEFT JOIN dbo.Users u ON o.UserId = u.Id
    WHERE p.Id = @paymentId
  `;

  const params = {
    paymentId: { type: sql.Int, value: paymentId }
  };

  // Restrict non-admins to their own payments
  if (userRole !== 'ADMIN') {
    queryStr += ' AND o.UserId = @userId';
    params.userId = { type: sql.Int, value: userId };
  }

  const result = await query(queryStr, params);

  if (!result.recordset || result.recordset.length === 0) {
    throw { status: 404, message: 'Payment not found' };
  }

  const p = result.recordset[0];

  return {
    id: p.Id,
    orderId: p.OrderId,
    orderStatus: p.OrderStatus,
    amount: parseFloat(p.Amount),
    paymentMethod: p.Method,
    paymentGateway: p.PaymentGateway,
    transactionRef: p.TransactionRef,
    status: p.PaymentStatus,
    createdAt: p.CreatedAt,
    updatedAt: p.UpdatedAt,
    orderAmount: parseFloat(p.OrderAmount),
    paymentGatewayOrderId: p.PaymentGatewayOrderId,
    paymentGatewayPaymentId: p.PaymentGatewayPaymentId,
    user: userRole === 'ADMIN'
      ? {
          id: p.UserId,
          name: p.UserName,
          email: p.UserEmail
        }
      : undefined
  };
}

module.exports = {
  getUserPaymentHistory,
  getAdminPaymentHistory,
  getPaymentDetails
};
