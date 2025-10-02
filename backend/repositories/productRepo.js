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

module.exports = {
  createCategory,
  createProduct,
  createProductCategory,
  createProductVariant,
  createVariantPrice,
  updateVariantPrice
};
