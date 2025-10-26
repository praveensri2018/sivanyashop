// Create new file: services/paymentHistoryService.js
const { query, sql } = require('../lib/db');

async function getUserPaymentHistory(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  const result = await query(`
    SELECT 
      p.Id, p.OrderId, p.PaymentGatewayOrderId, p.PaymentGatewayPaymentId,
      p.Amount, p.Currency, p.Status, p.PaymentMethod, p.CreatedAt,
      o.id OrderNumber, o.TotalAmount as OrderAmount,
      COUNT(*) OVER() as TotalCount
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
    payments: result.recordset.map(payment => ({
      id: payment.Id,
      orderId: payment.OrderId,
      orderNumber: payment.OrderNumber,
      paymentGatewayOrderId: payment.PaymentGatewayOrderId,
      paymentGatewayPaymentId: payment.PaymentGatewayPaymentId,
      amount: payment.Amount,
      currency: payment.Currency,
      status: payment.Status,
      paymentMethod: payment.PaymentMethod,
      createdAt: payment.CreatedAt,
      orderAmount: payment.OrderAmount
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

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
      p.Id, p.OrderId, p.PaymentGatewayOrderId, p.PaymentGatewayPaymentId,
      p.Amount, p.Currency, p.Status, p.PaymentMethod, p.CreatedAt,
      o.id OrderNumber, o.TotalAmount as OrderAmount,
      u.Id as UserId, u.Name as UserName, u.Email as UserEmail,
      COUNT(*) OVER() as TotalCount
    FROM dbo.Payments p
    INNER JOIN dbo.Orders o ON p.OrderId = o.Id
    LEFT JOIN dbo.Users u ON o.UserId = u.Id
    ${whereClause}
    ORDER BY p.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  const total = result.recordset[0]?.TotalCount || 0;

  return {
    payments: result.recordset.map(payment => ({
      id: payment.Id,
      orderId: payment.OrderId,
      orderNumber: payment.OrderNumber,
      paymentGatewayOrderId: payment.PaymentGatewayOrderId,
      paymentGatewayPaymentId: payment.PaymentGatewayPaymentId,
      amount: payment.Amount,
      currency: payment.Currency,
      status: payment.Status,
      paymentMethod: payment.PaymentMethod,
      createdAt: payment.CreatedAt,
      orderAmount: payment.OrderAmount,
      user: {
        id: payment.UserId,
        name: payment.UserName,
        email: payment.UserEmail
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

async function getPaymentDetails(paymentId, userId, userRole) {
  let queryStr = `
    SELECT 
      p.*,
      o.id OrderNumber, o.TotalAmount as OrderAmount, o.Status as OrderStatus,
      u.Name as UserName, u.Email as UserEmail
    FROM dbo.Payments p
    INNER JOIN dbo.Orders o ON p.OrderId = o.Id
    LEFT JOIN dbo.Users u ON o.UserId = u.Id
    WHERE p.Id = @paymentId
  `;

  const params = {
    paymentId: { type: sql.Int, value: paymentId }
  };

  // For non-admin users, restrict to their own payments
  if (userRole !== 'ADMIN') {
    queryStr += ' AND o.UserId = @userId';
    params.userId = { type: sql.Int, value: userId };
  }

  const result = await query(queryStr, params);

  if (!result.recordset || result.recordset.length === 0) {
    throw { status: 404, message: 'Payment not found' };
  }

  const payment = result.recordset[0];

  return {
    id: payment.Id,
    orderId: payment.OrderId,
    orderNumber: payment.OrderNumber,
    paymentGatewayOrderId: payment.PaymentGatewayOrderId,
    paymentGatewayPaymentId: payment.PaymentGatewayPaymentId,
    amount: payment.Amount,
    currency: payment.Currency,
    status: payment.Status,
    paymentMethod: payment.PaymentMethod,
    createdAt: payment.CreatedAt,
    updatedAt: payment.UpdatedAt,
    orderAmount: payment.OrderAmount,
    orderStatus: payment.OrderStatus,
    user: userRole === 'ADMIN' ? {
      id: payment.UserId,
      name: payment.UserName,
      email: payment.UserEmail
    } : undefined
  };
}

module.exports = {
  getUserPaymentHistory,
  getAdminPaymentHistory,
  getPaymentDetails
};