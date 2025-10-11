// => PLACE: backend/services/productService.js
const productRepo = require('../repositories/productRepo');

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

async function addVariant({ productId, sku, variantName, attributes, stockQty }) {
  return productRepo.createProductVariant({ productId, sku, variantName, attributes, stockQty });
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

async function updateVariant({ variantId, sku, variantName, attributes, stockQty }) {
  return productRepo.updateProductVariant({ variantId, sku, variantName, attributes, stockQty });
}



async function deleteVariant(variantId) {
  return productRepo.deleteProductVariant(variantId); // hard delete
}

async function deactivateVariant(variantId) {
  return productRepo.deactivateProductVariant(variantId); // soft delete (set IsActive = 0)
}

module.exports = {
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
  updateVariantPrice,getProductById
};
