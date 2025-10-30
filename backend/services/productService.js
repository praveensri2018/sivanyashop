// => PLACE: backend/services/productService.js
const productRepo = require('../repositories/productRepo');
const stockRepo = require('../repositories/stockRepo');
const stockService = require('../services/stockService');
const sizeChartRepo = require('../repositories/sizeChartRepo');

async function addCategory(name, parentCategoryId) {
  return productRepo.createCategory(name, parentCategoryId);
}

async function addProduct({ name, description, imagePath, createdById, categoryIds }) {
  const product = await productRepo.createProduct({ name, description, imagePath, createdById });

  // link product to categories
  if (categoryIds && categoryIds.length > 0) {
    for (const catId of categoryIds) {
      await productRepo.createProductCategory(product.Id, catId);
    }
  }

  return product;
}

async function addVariant({ productId, sku, variantName, attributes, stockQty = 0 }) {
  const variant = await productRepo.createProductVariant({ 
    productId, 
    sku, 
    variantName, 
    attributes, 
    stockQty 
  });

  // ✅ ADD THIS: Create initial stock ledger entry
  try {
    await stockService.createInitialStockLedger({
      productId,
      variantId: variant.Id,
      initialStock: stockQty
    });
  } catch (stockError) {
    console.error('Failed to create stock ledger entry:', stockError);
    // Don't throw - variant was created successfully
  }

  return variant;
}

async function updateVariantStock(
  variantId,
  newStockQty,
  movementType = 'MANUAL_ADJUST',
  options = {}
) {
  const usedStockRepo = options.stockRepo || stockRepo;
  const usedProductRepo = options.productRepo || productRepo;
  const logger = options.logger || console;

  logger.debug?.(`[STOCK] Start updateVariantStock | variantId=${variantId} | newQty=${newStockQty} | type=${movementType}`);

  if (variantId == null) throw new Error('variantId required');
  if (!Number.isFinite(newStockQty) || newStockQty < 0) throw new Error('Invalid newStockQty');

  if (!usedStockRepo?.getVariantStockById || !usedStockRepo?.insertStockLedger)
    throw new Error('Invalid stockRepo');
  if (!usedProductRepo?.updateVariantStock)
    throw new Error('Invalid productRepo');

  try {
    const currentStock = await usedStockRepo.getVariantStockById(variantId);
    logger.debug?.(`[STOCK] Current qty=${currentStock?.StockQty ?? 0}`);

    const previousQty = currentStock?.StockQty ?? 0;
    const productId = currentStock?.ProductId ?? null;
    const stockChange = newStockQty - previousQty;

    logger.debug?.(`[STOCK] Change=${stockChange} (${stockChange > 0 ? 'IN' : stockChange < 0 ? 'OUT' : 'NO CHANGE'})`);

    if (stockChange !== 0) {
      await usedStockRepo.insertStockLedger({
        productId,
        variantId,
        quantity: Math.abs(stockChange),
        movementType: stockChange > 0 ? 'STOCK_IN' : 'STOCK_OUT'
      });
      logger.debug?.(`[STOCK] Ledger inserted for variant ${variantId}`);
    }

    const result = await usedProductRepo.updateVariantStock(variantId, newStockQty);
    logger.debug?.(`[STOCK] Variant updated | newQty=${newStockQty}`);

    logger.info?.(`[STOCK] Done variantId=${variantId} | Δ=${stockChange}`);
    return result;
  } catch (err) {
    logger.error?.(`[STOCK] Failed variantId=${variantId} | msg=${err.message}`);
    throw err;
  }
}


async function setVariantPrice({ variantId, priceType, price }) {
  return productRepo.createVariantPrice({ variantId, priceType, price });
}

async function updateVariantPrice({ variantId, priceType, price }) {
  return productRepo.updateVariantPrice(variantId, priceType, price);
}


async function getAllProducts() {
  return productRepo.fetchAllProductsWithImagesAndCategories();
}

async function getAllCategories() {
  return productRepo.fetchAllCategories();
}

async function updateProduct({ productId, name, description, imagePath, categoryIds }) {
  const product = await productRepo.updateProductDetails({ productId, name, description, imagePath });

  if (categoryIds && Array.isArray(categoryIds)) {
    // Clear old categories and assign new ones
    await productRepo.deleteProductCategories(productId);
    for (const catId of categoryIds) {
      await productRepo.createProductCategory(productId, catId);
    }
  }

  return product;
}


async function getProductsPaginated({ page, limit }) {
  return productRepo.fetchProductsPaginated({ page, limit });
}

async function deleteProductCategories(productId) {
  return productRepo.deleteProductCategories(productId);
}

// Soft delete product: mark IsActive=0, remove categories & images (can keep images archived if you prefer)
async function softDeleteProduct(productId, deletedByUserId = null) {
  // optionally use deletedByUserId to write audit logs later
  return productRepo.softDeleteProduct(productId);
}


async function fetchTopSellingProducts() {
  return productRepo.getTopSellingProducts(); // define query in repo
}

async function fetchRecentlyViewedProducts(userId) {
  return productRepo.getRecentlyViewedProducts(userId);
}

async function fetchLowStockProducts(threshold = 10) {
  return productRepo.getLowStockProducts(threshold);
}

async function bulkUploadProducts(filePath) {
  // parse CSV/Excel file and create products
  return productRepo.bulkInsertProductsFromFile(filePath);
}

async function setProductFeatured(productId, isFeatured) {
  return productRepo.updateProductFeatured(productId, isFeatured);
}

async function addRecentlyViewedProduct(userId, productId) {
    return productRepo.addRecentlyViewed(userId, productId);
}

async function fetchRecentlyViewedProducts(userId, limit = 10) {
    return productRepo.getRecentlyViewed(userId, limit);
}


// PLACE: replace the existing getProductById function body in backend/services/productService.js with this version
async function getProductById(productId) {
  // basic product row
  const productRow = await productRepo.getProductRowById(productId);
  if (!productRow) return null;

  // categories, images, variants (existing behavior)
  const categoryIds = await productRepo.getCategoryIdsForProduct(productId);
  const images = await productRepo.getImagesForProduct(productId);
  const variants = await productRepo.getVariantsForProduct(productId);

  // fetch prices for all variant ids (if any)
  const variantIds = variants.map(v => v.Id).filter(Boolean);
  const priceMap = variantIds.length ? await productRepo.getActivePricesForVariants(variantIds) : {};

  // map prices into variant objects and pick customer/retailer price convenience fields
  const variantsNormalized = variants.map(v => {
    const prices = priceMap[v.Id] || [];
    const customerPrice = prices.find(p => p.PriceType === 'CUSTOMER')?.Price ?? null;
    const retailerPrice = prices.find(p => p.PriceType === 'RETAILER')?.Price ?? null;

    return {
      Id: v.Id,
      SKU: v.SKU,
      VariantName: v.VariantName,
      Attributes: v.Attributes,
      StockQty: v.StockQty,
      imageIds: v.ImageIds || [],
      customerPrice,
      retailerPrice,
      prices // full array
    };
  });

  // ---------- SIZE CHARTS: fetch assigned charts for this product ----------
  // PLACE: This is the new block to add. It uses sizeChartRepo.getProductSizeCharts(productId)
  let sizeCharts = [];
  let sizeChartIds = [];
  let primarySizeChartId = null;

  try {
    // sizeChartRepo.getProductSizeCharts returns full chart objects with IsPrimary (as implemented)
    const productSizeCharts = await sizeChartRepo.getProductSizeCharts(productId);
    if (Array.isArray(productSizeCharts) && productSizeCharts.length > 0) {
      // map db rows / SizeChart objects to plain objects the frontend can consume
      sizeCharts = productSizeCharts.map(sc => ({
        id: sc.Id ?? sc.id,
        name: sc.Name ?? sc.name,
        chartType: sc.ChartType ?? sc.chartType,
        description: sc.Description ?? sc.description,
        measurements: sc.Measurements ? (typeof sc.Measurements === 'string' ? JSON.parse(sc.Measurements) : sc.Measurements) : sc.measurements ?? null,
        isPrimary: !!sc.IsPrimary || !!sc.isPrimary
      }));

      sizeChartIds = sizeCharts.map(sc => Number(sc.id));
      const primary = sizeCharts.find(sc => sc.isPrimary);
      primarySizeChartId = primary ? Number(primary.id) : null;
    }
  } catch (err) {
    // PLACE: don't break product response if size chart lookup fails — just log
    console.error('Failed to load product size charts for productId', productId, err);
    sizeCharts = [];
    sizeChartIds = [];
    primarySizeChartId = null;
  }
  // ---------- end size chart block ----------

  // return normalized product (includes size chart data now)
  return {
    Id: productRow.Id,
    Name: productRow.Name,
    Description: productRow.Description,
    CategoryIds: categoryIds,
    images,
    variants: variantsNormalized,
    // size chart additions:
    sizeCharts,                // full objects (may include measurements, isPrimary)
    sizeChartIds,              // [id, id, ...]
    primarySizeChartId,        // id or null

    // keep other useful fields if helpful
    ImagePath: productRow.ImagePath,
    IsActive: productRow.IsActive,
    IsFeatured: productRow.IsFeatured,
    CreatedAt: productRow.CreatedAt
  };
}

/*
async function getProductById(productId) {
  // repo returns raw rows; assemble normalized object
  const productRow = await productRepo.getProductRowById(productId);
  if (!productRow) return null;

  const categoryIds = await productRepo.getCategoryIdsForProduct(productId);
  const images = await productRepo.getImagesForProduct(productId);
  const variants = await productRepo.getVariantsForProduct(productId);

  // fetch prices for all variant ids (if any)
  const variantIds = variants.map(v => v.Id).filter(Boolean);
  const priceMap = variantIds.length ? await productRepo.getActivePricesForVariants(variantIds) : {};

  // map prices into variant objects and pick customer/retailer price convenience fields
  const variantsNormalized = variants.map(v => {
    const prices = priceMap[v.Id] || [];
    const customerPrice = prices.find(p => p.PriceType === 'CUSTOMER')?.Price ?? null;
    const retailerPrice = prices.find(p => p.PriceType === 'RETAILER')?.Price ?? null;

    return {
      Id: v.Id,
      SKU: v.SKU,
      VariantName: v.VariantName,
      Attributes: v.Attributes,
      StockQty: v.StockQty,
      imageIds: v.ImageIds || [],
      customerPrice,
      retailerPrice,
      prices // full array
    };
  });

  return {
    Id: productRow.Id,
    Name: productRow.Name,
    Description: productRow.Description,
    CategoryIds: categoryIds,
    images,
    variants: variantsNormalized,
    // keep other useful fields if helpful
    ImagePath: productRow.ImagePath,
    IsActive: productRow.IsActive,
    IsFeatured: productRow.IsFeatured,
    CreatedAt: productRow.CreatedAt
  };
}
*/
async function updateVariant({ variantId, sku, variantName, attributes, stockQty }) {
  return productRepo.updateProductVariant({ variantId, sku, variantName, attributes, stockQty });
}



async function deleteVariant(variantId) {
  return productRepo.deleteProductVariant(variantId); // hard delete
}

async function deactivateVariant(variantId) {
  return productRepo.deactivateProductVariant(variantId); // soft delete (set IsActive = 0)
}


async function listPublic({ page = 1, limit = 24, q } = {}) {
  // repo returns items + total
  const { items, total } = await productRepo.fetchProductsForPriceType({ page, limit, q, priceType: 'CUSTOMER' });
  return { items, total };
}

/**
 * Authenticated listing: choose priceType based on role
 * - RETAILER -> RETAILER price
 * - anyone else (CUSTOMER) -> CUSTOMER price
 */
async function listForUser({ page = 1, limit = 24, q, userId = null, role = 'CUSTOMER' } = {}) {
  const priceType = role === 'RETAILER' ? 'RETAILER' : 'CUSTOMER';
  // you may pass userId to repo if you want to compute user-specific offers/discounts
  const { items, total } = await productRepo.fetchProductsForPriceType({ page, limit, q, priceType, userId });
  return { items, total };
}

/**
 * Public product details: show CUSTOMER price for variants
 */
async function getProductPublic(productId) {
  const product = await productRepo.getProductDetailsWithPrice({ productId, priceType: 'CUSTOMER' });
  return product;
}

/**
 * Authenticated product details: choose priceType based on role
 */
async function getProductForUser({ productId, userId = null, role = 'CUSTOMER' }) {
  const priceType = (role === 'RETAILER') ? 'RETAILER' : 'CUSTOMER';
  const product = await productRepo.getProductDetailsWithPrice({ productId, priceType, userId });
  return product;
}

module.exports = {
    listPublic,
  listForUser,
  getProductPublic,
  getProductForUser,
    deleteVariant,
  deactivateVariant,
    updateVariant,
   addRecentlyViewedProduct,
    fetchRecentlyViewedProducts,
  fetchTopSellingProducts,
  fetchRecentlyViewedProducts,
  fetchLowStockProducts,
  bulkUploadProducts,
  setProductFeatured,
  deleteProductCategories,
  softDeleteProduct,getProductsPaginated,updateProduct,getAllCategories, getAllProducts,
  addCategory,
  addProduct,
  addVariant,
  setVariantPrice,
  updateVariantPrice,getProductById,updateVariantStock
};
