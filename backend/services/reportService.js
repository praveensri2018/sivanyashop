// backend/services/reportService.js
const { query, sql } = require('../lib/db');

async function generateSalesReport(options = {}) {
  const { startDate, endDate, groupBy = 'day' } = options;

  // determine SQL grouping expression
  let groupByClause;
  switch (groupBy) {
    case 'day':
      groupByClause = "CAST(o.CreatedAt AS DATE)";
      break;
    case 'month':
      // SQL Server FORMAT: returns 'yyyy-MM'
      groupByClause = "FORMAT(o.CreatedAt, 'yyyy-MM')";
      break;
    case 'year':
      groupByClause = "YEAR(o.CreatedAt)";
      break;
    default:
      groupByClause = "CAST(o.CreatedAt AS DATE)";
  }

  // build WHERE conditions safely
  const conditions = ["o.Status != 'CANCELLED'"];
  const params = {};

  if (startDate) {
    conditions.push('o.CreatedAt >= @startDate');
    params.startDate = { type: sql.DateTime, value: new Date(startDate) };
  }

  if (endDate) {
    conditions.push('o.CreatedAt <= @endDate');
    params.endDate = { type: sql.DateTime, value: new Date(endDate) };
  }

  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const result = await query(
    `
    SELECT 
      ${groupByClause} AS Period,
      COUNT(*) AS OrderCount,
      SUM(o.TotalAmount) AS TotalRevenue,
      AVG(o.TotalAmount) AS AvgOrderValue,
      COUNT(DISTINCT o.UserId) AS UniqueCustomers
    FROM dbo.Orders o
    ${whereClause}
    GROUP BY ${groupByClause}
    ORDER BY Period DESC
    `,
    params
  );

  // PLACE RESULT HERE — The query result rows are in result.recordset.
  // Example usage (where to place result):
  //   - In an Express route: return res.json(result.recordset);
  //   - To write to CSV: pass result.recordset to your CSV exporter.
  //   - To further process in code: const rows = result.recordset;
  return result.recordset;
}

async function generateStockReport(lowStockThreshold = 10) {
  // params: lowStockThreshold
  const params = {
    lowStockThreshold: { type: sql.Int, value: lowStockThreshold }
  };

  const result = await query(
    `
    SELECT 
      p.Id AS ProductId,
      p.Name AS ProductName,
      pv.Id AS VariantId,
      pv.VariantName,
      pv.StockQty AS CurrentStock,
      pv.SKU,
      CASE 
        WHEN pv.StockQty = 0 THEN 'OUT_OF_STOCK'
        WHEN pv.StockQty <= @lowStockThreshold THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
      END AS StockStatus
    FROM dbo.Products p
    INNER JOIN dbo.ProductVariants pv ON p.Id = pv.ProductId
    WHERE p.IsActive = 1
    ORDER BY pv.StockQty ASC
    `,
    params
  );

  // PLACE RESULT HERE — result.recordset contains variant stock rows.
  // Example usage:
  //   - res.json(result.recordset)
  //   - send low-stock alerts by filtering result.recordset for StockStatus !== 'IN_STOCK'
  return result.recordset;
}

async function generateCustomerReport(options = {}) {
  const { startDate, endDate } = options;
  const params = {};

  // We'll build WHERE conditions; ensure u.Role condition is included
  const conditions = ["u.Role = 'CUSTOMER'"];

  // Add date filters (these filters will filter orders considered in aggregation)
  // Note: Because we LEFT JOIN orders, filtering on o.CreatedAt in WHERE effectively
  // makes it similar to an INNER JOIN for the date range. This matches previous behavior
  // which used HAVING COUNT(o.Id) > 0 to only include customers with orders.
  if (startDate) {
    conditions.push('o.CreatedAt >= @startDate');
    params.startDate = { type: sql.DateTime, value: new Date(startDate) };
  }

  if (endDate) {
    conditions.push('o.CreatedAt <= @endDate');
    params.endDate = { type: sql.DateTime, value: new Date(endDate) };
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const result = await query(
    `
    SELECT 
      u.Id AS CustomerId,
      u.Name AS CustomerName,
      u.Email AS CustomerEmail,
      COUNT(o.Id) AS TotalOrders,
      SUM(o.TotalAmount) AS TotalSpent,
      MAX(o.CreatedAt) AS LastOrderDate,
      AVG(o.TotalAmount) AS AvgOrderValue
    FROM dbo.Users u
    LEFT JOIN dbo.Orders o 
      ON u.Id = o.UserId AND o.Status != 'CANCELLED'
    ${whereClause}
    GROUP BY u.Id, u.Name, u.Email
    HAVING COUNT(o.Id) > 0
    ORDER BY TotalSpent DESC
    `,
    params
  );

  // PLACE RESULT HERE — result.recordset contains customers with orders (and aggregated metrics).
  // Example usage:
  //   - res.json(result.recordset) to return to client
  //   - Use result.recordset to feed a loyalty or VIP-selection job
  return result.recordset;
}

module.exports = {
  generateSalesReport,
  generateStockReport,
  generateCustomerReport
};
