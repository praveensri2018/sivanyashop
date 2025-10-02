// => PLACE: backend/repositories/productRepo.js
const { query, sql } = require('../lib/db');

async function createCategory(name, parentCategoryId = null) {
  const result = await query(
    'INSERT INTO dbo.Categories (Name, ParentCategoryId) OUTPUT INSERTED.Id VALUES (@name, @parentCategoryId)',
    {
      name: { type: sql.NVarChar, value: name },
      parentCategoryId: { type: sql.Int, value: parentCategoryId }
    }
  );
  return result.recordset[0];
}

async function createProduct({ name, description, imagePath, createdById }) {
  const result = await query(
    'INSERT INTO dbo.Products (Name, Description, ImagePath, CreatedById) OUTPUT INSERTED.Id VALUES (@name, @description, @imagePath, @createdById)',
    {
      name: { type: sql.NVarChar, value: name },
      description: { type: sql.NVarChar, value: description },
      imagePath: { type: sql.NVarChar, value: imagePath },
      createdById: { type: sql.Int, value: createdById }
    }
  );
  return result.recordset[0];
}

async function createProductCategory(productId, categoryId) {
  await query(
    'INSERT INTO dbo.ProductCategories (ProductId, CategoryId) VALUES (@productId, @categoryId)',
    {
      productId: { type: sql.Int, value: productId },
      categoryId: { type: sql.Int, value: categoryId }
    }
  );
}

async function createProductVariant({ productId, sku, variantName, attributes, stockQty }) {
  const result = await query(
    'INSERT INTO dbo.ProductVariants (ProductId, SKU, VariantName, Attributes, StockQty) OUTPUT INSERTED.Id VALUES (@productId, @sku, @variantName, @attributes, @stockQty)',
    {
      productId: { type: sql.Int, value: productId },
      sku: { type: sql.NVarChar, value: sku },
      variantName: { type: sql.NVarChar, value: variantName },
      attributes: { type: sql.NVarChar, value: attributes },
      stockQty: { type: sql.Int, value: stockQty }
    }
  );
  return result.recordset[0];
}

async function createVariantPrice({ variantId, priceType, price }) {
  const result = await query(
    'INSERT INTO dbo.VariantPrices (VariantId, PriceType, Price) OUTPUT INSERTED.Id VALUES (@variantId, @priceType, @price)',
    {
      variantId: { type: sql.Int, value: variantId },
      priceType: { type: sql.NVarChar, value: priceType },
      price: { type: sql.Decimal, value: price }
    }
  );
  return result.recordset[0];
}

async function updateVariantPrice(variantId, priceType, newPrice) {
  // deactivate old price
  await query(
    `UPDATE dbo.VariantPrices 
     SET IsActive = 0, EffectiveTo = SYSDATETIMEOFFSET()
     WHERE VariantId = @variantId AND PriceType = @priceType AND IsActive = 1`,
    { variantId: { type: sql.Int, value: variantId }, priceType: { type: sql.NVarChar, value: priceType } }
  );

  // insert new price
  const result = await createVariantPrice({ variantId, priceType, price: newPrice });
  return result;
}

async function fetchAllProductsWithImagesAndCategories() {
  const result = await query(`
    SELECT 
        p.Id AS ProductId,
        p.Name AS ProductName,
        p.Description,
        p.ImagePath,
        p.IsActive,
        p.IsFeatured,
        ISNULL(
          (SELECT STRING_AGG(pc.CategoryId, ',') 
           FROM dbo.ProductCategories pc 
           WHERE pc.ProductId = p.Id), ''
        ) AS CategoryIds,
        ISNULL(
          (SELECT STRING_AGG(pi.ImageUrl, ',') 
           FROM dbo.ProductImages pi 
           WHERE pi.ProductId = p.Id), ''
        ) AS ImageUrls
    FROM dbo.Products p
    ORDER BY p.Id DESC
  `);

  // Map comma-separated strings to arrays
  return result.recordset.map(p => ({
    ...p,
    CategoryIds: p.CategoryIds ? p.CategoryIds.split(',').map(Number) : [],
    ImageUrls: p.ImageUrls ? p.ImageUrls.split(',') : []
  }));
}

async function fetchAllCategories() {
  const result = await query('SELECT Id, Name, ParentCategoryId FROM dbo.Categories ORDER BY Name');
  return result.recordset;
}

async function updateProductDetails({ productId, name, description, imagePath }) {
  const result = await query(`
    UPDATE dbo.Products 
    SET Name = @name, Description = @description, ImagePath = @imagePath
    OUTPUT INSERTED.*
    WHERE Id = @productId`,
    {
      productId: { type: sql.Int, value: productId },
      name: { type: sql.NVarChar, value: name },
      description: { type: sql.NVarChar, value: description },
      imagePath: { type: sql.NVarChar, value: imagePath }
    }
  );
  return result.recordset[0];
}


async function fetchProductsPaginated({ page, limit }) {
  const offset = (page - 1) * limit;

  const result = await query(`
    SELECT 
      p.Id AS ProductId,
      p.Name AS ProductName,
      p.Description,
      p.ImagePath,
      ISNULL((SELECT STRING_AGG(pc.CategoryId, ',') FROM dbo.ProductCategories pc WHERE pc.ProductId = p.Id), '') AS CategoryIds,
      ISNULL((SELECT STRING_AGG(pi.ImageUrl, ',') FROM dbo.ProductImages pi WHERE pi.ProductId = p.Id), '') AS ImageUrls
    FROM dbo.Products p
    ORDER BY p.Id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      offset: { type: sql.Int, value: offset },
      limit: { type: sql.Int, value: limit }
    }
  );

  const countResult = await query('SELECT COUNT(*) AS total FROM dbo.Products');
  const total = countResult.recordset[0].total;

  return {
    products: result.recordset.map(p => ({
      ...p,
      CategoryIds: p.CategoryIds ? p.CategoryIds.split(',').map(Number) : [],
      ImageUrls: p.ImageUrls ? p.ImageUrls.split(',') : []
    })),
    total
  };
}

async function deleteProductCategories(productId) {
  // removes mappings from ProductCategories
  await query('DELETE FROM dbo.ProductCategories WHERE ProductId = @productId', {
    productId: { type: sql.Int, value: productId }
  });
  return { success: true };
}

async function deleteProductImages(productId) {
  // if you want to keep DB rows for audit, change this to UPDATE instead of DELETE.
  await query('DELETE FROM dbo.ProductImages WHERE ProductId = @productId', {
    productId: { type: sql.Int, value: productId }
  });
}

async function softDeleteProduct(productId) {
  // 1) mark product as inactive
  const updated = await query(`
    UPDATE dbo.Products
    SET IsActive = 0
    OUTPUT INSERTED.*
    WHERE Id = @productId
  `, { productId: { type: sql.Int, value: productId } });

  if (!updated.recordset || updated.recordset.length === 0) {
    throw { status: 404, message: 'Product not found' };
  }

  // 2) delete category links
  await deleteProductCategories(productId);

  // 3) delete images (or change to archive if you prefer)
  await deleteProductImages(productId);

  // Optionally: you can also mark variants as inactive instead of deleting them.
  await query('UPDATE dbo.ProductVariants SET StockQty = 0 WHERE ProductId = @productId', {
    productId: { type: sql.Int, value: productId }
  });

  return updated.recordset[0];
}

async function getTopSellingProducts(limit = 10) {
  const result = await query(`
    SELECT TOP (@limit) p.Id, p.Name, SUM(oi.Qty) AS SoldQty
    FROM dbo.OrderItems oi
    JOIN dbo.Products p ON oi.ProductId = p.Id
    GROUP BY p.Id, p.Name
    ORDER BY SoldQty DESC
  `, { limit: { type: sql.Int, value: limit } });
  return result.recordset;
}

// Low-stock products
async function getLowStockProducts(threshold = 10) {
  const result = await query(`
    SELECT p.Id, p.Name, SUM(pv.StockQty) AS TotalStock
    FROM dbo.ProductVariants pv
    JOIN dbo.Products p ON pv.ProductId = p.Id
    GROUP BY p.Id, p.Name
    HAVING SUM(pv.StockQty) <= @threshold
  `, { threshold: { type: sql.Int, value: threshold } });
  return result.recordset;
}

// Mark product as featured
async function updateProductFeatured(productId, isFeatured) {
  const result = await query(`
    UPDATE dbo.Products
    SET IsFeatured = @isFeatured
    OUTPUT INSERTED.*
    WHERE Id = @productId
  `, {
    productId: { type: sql.Int, value: productId },
    isFeatured: { type: sql.Bit, value: isFeatured }
  });
  return result.recordset[0];
}

// Placeholder: bulk upload products from CSV/Excel
async function bulkInsertProductsFromFile(filePath) {
  // TODO: parse CSV/XLSX and insert products
  return { message: 'Bulk upload logic not implemented yet' };
}

async function addRecentlyViewed(userId, productId) {
    await query(
        `MERGE dbo.RecentlyViewedProducts AS target
         USING (SELECT @userId AS UserId, @productId AS ProductId) AS source
         ON target.UserId = source.UserId AND target.ProductId = source.ProductId
         WHEN MATCHED THEN 
             UPDATE SET ViewedAt = SYSDATETIMEOFFSET()
         WHEN NOT MATCHED THEN
             INSERT (UserId, ProductId, ViewedAt) VALUES (@userId, @productId, SYSDATETIMEOFFSET());`,
        { userId: { type: sql.Int, value: userId }, productId: { type: sql.Int, value: productId } }
    );
}

async function getRecentlyViewed(userId, limit = 10) {
    const result = await query(
        `SELECT TOP (@limit) p.Id, p.Name, p.Description, p.ImagePath
         FROM dbo.RecentlyViewedProducts rv
         INNER JOIN dbo.Products p ON p.Id = rv.ProductId
         WHERE rv.UserId = @userId
         ORDER BY rv.ViewedAt DESC`,
        { userId: { type: sql.Int, value: userId }, limit: { type: sql.Int, value: limit } }
    );
    return result.recordset;
}

module.exports = {
  addRecentlyViewed, getRecentlyViewed ,
  getTopSellingProducts,
  getLowStockProducts,
  updateProductFeatured,
  bulkInsertProductsFromFile,
  softDeleteProduct,deleteProductImages,fetchProductsPaginated, updateProductDetails,deleteProductCategories,
  fetchAllCategories,
  createCategory,
  createProduct,
  createProductCategory,
  createProductVariant,
  createVariantPrice,
  updateVariantPrice,
  fetchAllProductsWithImagesAndCategories
};
