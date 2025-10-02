// => PLACE: backend/controllers/productController.js
const productService = require('../services/productService');

async function createCategory(req, res, next) {
  try {
    const { name, parentCategoryId } = req.body;
    const category = await productService.addCategory(name, parentCategoryId);
    res.json({ success: true, category });
  } catch (err) { next(err); }
}

async function createProduct(req, res, next) {
  try {
    const { name, description, imagePath, categoryIds } = req.body;
    const product = await productService.addProduct({
      name,
      description,
      imagePath,
      createdById: req.user.id,
      categoryIds
    });
    res.json({ success: true, product });
  } catch (err) { next(err); }
}

async function createVariant(req, res, next) {
  try {
    const { productId, sku, variantName, attributes, stockQty } = req.body;
    const variant = await productService.addVariant({ productId, sku, variantName, attributes, stockQty });
    res.json({ success: true, variant });
  } catch (err) { next(err); }
}

async function setPrice(req, res, next) {
  try {
    const { variantId, priceType, price } = req.body;
    const variantPrice = await productService.setVariantPrice({ variantId, priceType, price });
    res.json({ success: true, variantPrice });
  } catch (err) { next(err); }
}

async function updatePrice(req, res, next) {
  try {
    const { variantId, priceType, price } = req.body;
    const variantPrice = await productService.updateVariantPrice({ variantId, priceType, price });
    res.json({ success: true, variantPrice });
  } catch (err) { next(err); }
}

module.exports = { createCategory, createProduct, createVariant, setPrice, updatePrice };
