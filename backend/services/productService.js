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


module.exports = { deleteProductCategories,
  softDeleteProduct,getProductsPaginated,updateProduct,getAllCategories, getAllProducts,
  addCategory,
  addProduct,
  addVariant,
  setVariantPrice,
  updateVariantPrice
};
