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

module.exports = {
  addCategory,
  addProduct,
  addVariant,
  setVariantPrice,
  updateVariantPrice
};
