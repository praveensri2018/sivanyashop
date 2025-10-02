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

async function getAllProducts(req, res, next) {
  try {
    const products = await productService.getAllProducts();
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
}

async function getAllCategories(req, res, next) {
  try {
    const categories = await productService.getAllCategories();
    res.json({ success: true, categories });
  } catch (err) { next(err); }
}

async function updateProduct(req, res, next) {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, imagePath, categoryIds } = req.body;

    const updatedProduct = await productService.updateProduct({
      productId,
      name,
      description,
      imagePath,
      categoryIds
    });

    res.json({ success: true, product: updatedProduct });
  } catch (err) { next(err); }
}

async function getProductsPaginated(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { products, total } = await productService.getProductsPaginated({ page, limit });
    res.json({ success: true, products, total, page, limit });
  } catch (err) { next(err); }
}


async function deleteProductCategories(req, res, next) {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    await productService.deleteProductCategories(productId);
    res.json({ success: true, message: 'Product categories deleted' });
  } catch (err) { next(err); }
}

async function deleteProduct(req, res, next) {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    await productService.softDeleteProduct(productId, req.user && req.user.id);
    res.json({ success: true, message: 'Product soft-deleted' });
  } catch (err) { next(err); }
}


module.exports = {deleteProductCategories,
  deleteProduct,getProductsPaginated,updateProduct,getAllCategories, getAllProducts, createCategory, createProduct, createVariant, setPrice, updatePrice };
