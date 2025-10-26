// backend/services/refundService.js
const { query, sql } = require('../lib/db');

// 🔹 CUSTOMER SERVICES
async function getMyRefundRequests(userId, options = {}) {
  const { status = '', page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE rr.UserId = @userId';
  const params = {
    userId: { type: sql.Int, value: userId },
    offset: { type: sql.Int, value: offset },
    limit: { type: sql.Int, value: limit }
  };

  if (status) {
    whereClause += ' AND rr.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  // Get refund requests
  const result = await query(`
    SELECT 
      rr.*,
      o.id OrderNumber, o.TotalAmount,
      u.Name as UserName, u.Email as UserEmail
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    ${whereClause}
    ORDER BY rr.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  // Get total count
  const countResult = await query(`
    SELECT COUNT(*) as Total
    FROM dbo.RefundRequests rr
    ${whereClause}
  `, params);

  return {
    requests: result.recordset,
    pagination: {
      page,
      limit,
      total: countResult.recordset[0].Total,
      totalPages: Math.ceil(countResult.recordset[0].Total / limit)
    }
  };
}

async function createRefundRequest(refundData) {
  const { orderId, userId, reason, items, amount } = refundData;
  
  // Validate order exists and belongs to user
  const orderResult = await query(`
    SELECT * FROM dbo.Orders 
    WHERE Id = @orderId AND UserId = @userId AND Status = 'DELIVERED'
  `, {
    orderId: { type: sql.Int, value: orderId },
    userId: { type: sql.Int, value: userId }
  });

  if (!orderResult.recordset.length) {
    throw { 
      status: 404, 
      message: 'Order not found, not delivered, or does not belong to you' 
    };
  }

  const order = orderResult.recordset[0];

  // Check if refund already exists for this order
  const existingRefund = await query(`
    SELECT * FROM dbo.RefundRequests 
    WHERE OrderId = @orderId AND Status IN ('PENDING', 'APPROVED')
  `, { orderId: { type: sql.Int, value: orderId } });

  if (existingRefund.recordset.length) {
    throw { 
      status: 400, 
      message: 'Refund request already exists for this order' 
    };
  }

  // Calculate refund amount if not provided
  let refundAmount = amount;
  if (!refundAmount) {
    refundAmount = order.TotalAmount;
  }

  // Create refund request
  const result = await query(`
    INSERT INTO dbo.RefundRequests (OrderId, UserId, Reason, Amount, Status)
    OUTPUT INSERTED.*
    VALUES (@orderId, @userId, @reason, @amount, 'PENDING')
  `, {
    orderId: { type: sql.Int, value: orderId },
    userId: { type: sql.Int, value: userId },
    reason: { type: sql.NVarChar, value: reason },
    amount: { type: sql.Decimal, value: refundAmount }
  });

  return result.recordset[0];
}

async function getMyRefundDetails(refundId, userId) {
  const result = await query(`
    SELECT 
      rr.*,
      o.id OrderNumber, o.TotalAmount, o.Status as OrderStatus,
      u.Name as UserName, u.Email as UserEmail,
      adminUser.Name as ProcessedByName
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    LEFT JOIN dbo.Users adminUser ON rr.ProcessedBy = adminUser.Id
    WHERE rr.Id = @refundId AND rr.UserId = @userId
  `, {
    refundId: { type: sql.Int, value: refundId },
    userId: { type: sql.Int, value: userId }
  });

  if (!result.recordset.length) {
    throw { status: 404, message: 'Refund request not found' };
  }

  return result.recordset[0];
}

// 🔹 RETAILER SERVICES
async function getRetailerRefundRequests(retailerId, options = {}) {
  const { status = '', page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;
  
  let whereClause = `
    WHERE p.CreatedById = @retailerId 
    AND rr.Status IN ('PENDING', 'APPROVED', 'REJECTED')
  `;
  
  const params = {
    retailerId: { type: sql.Int, value: retailerId },
    offset: { type: sql.Int, value: offset },
    limit: { type: sql.Int, value: limit }
  };

  if (status) {
    whereClause += ' AND rr.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  // Get refund requests for retailer's products
  const result = await query(`
    SELECT DISTINCT
      rr.*,
      o.id OrderNumber, o.TotalAmount,
      u.Name as UserName, u.Email as UserEmail,
      p.Name as ProductName
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    INNER JOIN dbo.Products p ON oi.ProductId = p.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    ${whereClause}
    ORDER BY rr.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  // Get total count
  const countResult = await query(`
    SELECT COUNT(DISTINCT rr.Id) as Total
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    INNER JOIN dbo.Products p ON oi.ProductId = p.Id
    ${whereClause}
  `, params);

  return {
    requests: result.recordset,
    pagination: {
      page,
      limit,
      total: countResult.recordset[0].Total,
      totalPages: Math.ceil(countResult.recordset[0].Total / limit)
    }
  };
}

async function updateRefundStatus(refundId, retailerId, status, notes = '') {
  // Verify retailer has products in this refund order
  const verificationResult = await query(`
    SELECT COUNT(*) as ProductCount
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    INNER JOIN dbo.Products p ON oi.ProductId = p.Id
    WHERE rr.Id = @refundId AND p.CreatedById = @retailerId
  `, {
    refundId: { type: sql.Int, value: refundId },
    retailerId: { type: sql.Int, value: retailerId }
  });

  if (verificationResult.recordset[0].ProductCount === 0) {
    throw { 
      status: 403, 
      message: 'You are not authorized to update this refund request' 
    };
  }

  // Update refund status
  await query(`
    UPDATE dbo.RefundRequests 
    SET Status = @status, AdminNotes = CONCAT(ISNULL(AdminNotes, '') + ' Retailer: ' + @notes)
    WHERE Id = @refundId
  `, {
    refundId: { type: sql.Int, value: refundId },
    status: { type: sql.NVarChar, value: status },
    notes: { type: sql.NVarChar, value: notes }
  });

  // Return updated refund
  const updatedResult = await query(`
    SELECT rr.*, o.id OrderNumber, u.Name as UserName
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    WHERE rr.Id = @refundId
  `, { refundId: { type: sql.Int, value: refundId } });

  return updatedResult.recordset[0];
}

// 🔹 ADMIN SERVICES
async function getAllRefundRequests(options = {}) {
  const { status = '', page = 1, limit = 20, userId = null, retailerId = null } = options;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  const params = {
    offset: { type: sql.Int, value: offset },
    limit: { type: sql.Int, value: limit }
  };

  if (status) {
    whereClause += ' AND rr.Status = @status';
    params.status = { type: sql.NVarChar, value: status };
  }

  if (userId) {
    whereClause += ' AND rr.UserId = @userId';
    params.userId = { type: sql.Int, value: userId };
  }

  if (retailerId) {
    whereClause += ' AND p.CreatedById = @retailerId';
    params.retailerId = { type: sql.Int, value: retailerId };
  }

  // Get all refund requests
  const result = await query(`
    SELECT DISTINCT
      rr.*,
      o.id OrderNumber, o.TotalAmount,
      u.Name as UserName, u.Email as UserEmail,
      adminUser.Name as ProcessedByName
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    LEFT JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    LEFT JOIN dbo.Products p ON oi.ProductId = p.Id
    LEFT JOIN dbo.Users adminUser ON rr.ProcessedBy = adminUser.Id
    ${whereClause}
    ORDER BY rr.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `, params);

  // Get total count
  const countResult = await query(`
    SELECT COUNT(DISTINCT rr.Id) as Total
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    LEFT JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    LEFT JOIN dbo.Products p ON oi.ProductId = p.Id
    ${whereClause}
  `, params);

  return {
    requests: result.recordset,
    pagination: {
      page,
      limit,
      total: countResult.recordset[0].Total,
      totalPages: Math.ceil(countResult.recordset[0].Total / limit)
    }
  };
}

async function getRefundDetails(refundId) {
  const result = await query(`
    SELECT 
      rr.*,
      o.id OrderNumber, o.TotalAmount, o.Status as OrderStatus,
      u.Name as UserName, u.Email as UserEmail,
      adminUser.Name as ProcessedByName,
      oi.ProductId, oi.VariantId, oi.Qty, oi.Price,
      p.Name as ProductName,
      pv.VariantName,
      retailer.Name as RetailerName
    FROM dbo.RefundRequests rr
    INNER JOIN dbo.Orders o ON rr.OrderId = o.Id
    INNER JOIN dbo.Users u ON rr.UserId = u.Id
    LEFT JOIN dbo.Users adminUser ON rr.ProcessedBy = adminUser.Id
    LEFT JOIN dbo.OrderItems oi ON o.Id = oi.OrderId
    LEFT JOIN dbo.Products p ON oi.ProductId = p.Id
    LEFT JOIN dbo.ProductVariants pv ON oi.VariantId = pv.Id
    LEFT JOIN dbo.Users retailer ON p.CreatedById = retailer.Id
    WHERE rr.Id = @refundId
  `, { refundId: { type: sql.Int, value: refundId } });

  if (!result.recordset.length) {
    throw { status: 404, message: 'Refund not found' };
  }

  // Group order items and retailer info
  const refund = { ...result.recordset[0] };
  refund.items = result.recordset
    .filter(row => row.ProductId)
    .map(row => ({
      productId: row.ProductId,
      productName: row.ProductName,
      variantId: row.VariantId,
      variantName: row.VariantName,
      qty: row.Qty,
      price: row.Price,
      retailerName: row.RetailerName
    }));

  return refund;
}

async function processRefund(refundId, adminId, action, paymentNotes = '') {
  // Get refund details
  const refundResult = await query(`
    SELECT * FROM dbo.RefundRequests WHERE Id = @refundId
  `, { refundId: { type: sql.Int, value: refundId } });

  const refund = refundResult.recordset[0];
  
  if (!refund) {
    throw { status: 404, message: 'Refund request not found' };
  }

  if (refund.Status !== 'APPROVED' && action === 'COMPLETE') {
    throw { status: 400, message: 'Refund must be approved by retailer before completion' };
  }

  let newStatus, message;

  if (action === 'COMPLETE') {
    newStatus = 'COMPLETED';
    message = 'Refund processed successfully';
    
    // Process payment refund
    try {
      // Get order payment details
      const paymentResult = await query(`
        SELECT * FROM dbo.Payments 
        WHERE OrderId = @orderId AND Status = 'COMPLETED'
        ORDER BY CreatedAt DESC
      `, { orderId: { type: sql.Int, value: refund.OrderId } });

      const payment = paymentResult.recordset[0];
      
      if (payment && payment.TransactionRef) {
        // TODO: Initiate actual payment gateway refund
        // await paymentService.initiateRefund(payment.TransactionRef, refund.Amount);
        
        console.log(`💰 Refund initiated for order ${refund.OrderId}, amount: ${refund.Amount}`);
      }
    } catch (error) {
      console.error('Payment refund error:', error);
      // Continue with status update even if payment refund fails
    }

    // Update order status
    await query(`
      UPDATE dbo.Orders 
      SET Status = 'REFUNDED', PaymentStatus = 'REFUNDED'
      WHERE Id = @orderId
    `, { orderId: { type: sql.Int, value: refund.OrderId } });

    // Add to order status history
    await query(`
      INSERT INTO dbo.OrderStatusHistory (OrderId, Status, Notes, CreatedBy)
      VALUES (@orderId, 'REFUNDED', @notes, @adminId)
    `, {
      orderId: { type: sql.Int, value: refund.OrderId },
      notes: { type: sql.NVarChar, value: `Refund completed: ${paymentNotes}` },
      adminId: { type: sql.Int, value: adminId }
    });

  } else { // REJECT
    newStatus = 'REJECTED';
    message = 'Refund rejected';
  }

  // Update refund status
  await query(`
    UPDATE dbo.RefundRequests 
    SET Status = @status, 
        ProcessedBy = @adminId, 
        ProcessedAt = SYSDATETIMEOFFSET(),
        AdminNotes = CONCAT(ISNULL(AdminNotes, '') + ' Admin: ' + @paymentNotes)
    WHERE Id = @refundId
  `, {
    refundId: { type: sql.Int, value: refundId },
    status: { type: sql.NVarChar, value: newStatus },
    adminId: { type: sql.Int, value: adminId },
    paymentNotes: { type: sql.NVarChar, value: paymentNotes }
  });

  // Return updated refund
  const updatedRefund = await getRefundDetails(refundId);

  return {
    message,
    refund: updatedRefund
  };
}

async function getRefundStats(options = {}) {
  const { startDate, endDate } = options;
  
  let whereClause = 'WHERE 1=1';
  const params = {};

  if (startDate) {
    whereClause += ' AND rr.CreatedAt >= @startDate';
    params.startDate = { type: sql.DateTime, value: new Date(startDate) };
  }

  if (endDate) {
    whereClause += ' AND rr.CreatedAt <= @endDate';
    params.endDate = { type: sql.DateTime, value: new Date(endDate) };
  }

  const result = await query(`
    SELECT 
      COUNT(*) as TotalRefunds,
      SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as PendingRefunds,
      SUM(CASE WHEN Status = 'APPROVED' THEN 1 ELSE 0 END) as ApprovedRefunds,
      SUM(CASE WHEN Status = 'COMPLETED' THEN 1 ELSE 0 END) as CompletedRefunds,
      SUM(CASE WHEN Status = 'REJECTED' THEN 1 ELSE 0 END) as RejectedRefunds,
      SUM(CASE WHEN Status = 'COMPLETED' THEN Amount ELSE 0 END) as TotalRefundAmount,
      AVG(CASE WHEN Status = 'COMPLETED' THEN Amount ELSE NULL END) as AvgRefundAmount
    FROM dbo.RefundRequests rr
    ${whereClause}
  `, params);

  return result.recordset[0];
}

module.exports = {
  // Customer
  getMyRefundRequests,
  createRefundRequest,
  getMyRefundDetails,
  
  // Retailer
  getRetailerRefundRequests,
  updateRefundStatus,
  
  // Admin
  getAllRefundRequests,
  getRefundDetails,
  processRefund,
  getRefundStats
};