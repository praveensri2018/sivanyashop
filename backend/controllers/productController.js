// => PLACE: backend/controllers/productController.js
const productService = require('../services/productService');
const categoryService = require('../services/categoryService');

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


async function getTopSellingProducts(req, res, next) {
  try {
    const products = await productService.fetchTopSellingProducts();
    res.json({ success: true, products });
  } catch (err) { next(err); }
}

// Recently viewed products
async function getRecentlyViewedProducts(req, res, next) {
  try {
    const userId = req.user.id; // optional auth
    const products = await productService.fetchRecentlyViewedProducts(userId);
    res.json({ success: true, products });
  } catch (err) { next(err); }
}

// Low-stock products
async function getLowStockProducts(req, res, next) {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await productService.fetchLowStockProducts(threshold);
    res.json({ success: true, products });
  } catch (err) { next(err); }
}

// Bulk product upload (CSV/Excel)
async function bulkUploadProducts(req, res, next) {
  try {
    const file = req.file; // multer file middleware
    const result = await productService.bulkUploadProducts(file.path);
    res.json({ success: true, result });
  } catch (err) { next(err); }
}

// Mark product as featured
async function markProductFeatured(req, res, next) {
  try {
    const productId = parseInt(req.params.id);
    const isFeatured = req.body.isFeatured; // boolean
    const product = await productService.setProductFeatured(productId, isFeatured);
    res.json({ success: true, product });
  } catch (err) { next(err); }
}

async function recentlyViewedProducts(req, res, next) {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const products = await productService.fetchRecentlyViewedProducts(req.user.id, limit);
        res.json({ success: true, products });
    } catch (err) {
        next(err);
    }
}

async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, parentCategoryId } = req.body;
    const updated = await categoryService.updateCategory(id, name, parentCategoryId);
    res.json({ success: true, category: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await categoryService.deleteCategory(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

async function getCategoryTree(req, res, next) {
  try {
    const tree = await categoryService.getCategoryTree();
    res.json({ success: true, tree });
  } catch (err) {
    next(err);
  }
}

async function getProductsByCategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id);
    const products = await categoryService.getProductsByCategory(categoryId);
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const product = await productService.getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Return shape expected by frontend: { product: { Id, Name, Description, CategoryIds, images, variants } }
    return res.json({ product });
  } catch (err) {
    next(err);
  }
}


async function updateVariant(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId) || variantId <= 0) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const { sku, variantName, attributes, stockQty } = req.body;
    const updated = await productService.updateVariant({ variantId, sku, variantName, attributes, stockQty: Number(stockQty || 0) });

    if (!updated) return res.status(404).json({ success: false, message: 'Variant not found' });
    res.json({ success: true, variant: updated });
  } catch (err) { next(err); }
}


async function deleteVariant(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId) || variantId <= 0) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    await productService.deleteVariant(variantId); // implement in service/repo (hard delete)
    res.json({ success: true, variantId });
  } catch (err) { next(err); }
}

async function deactivateVariant(req, res, next) {
  try {
    const variantId = parseInt(req.params.id, 10);
    if (isNaN(variantId) || variantId <= 0) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const updated = await productService.deactivateVariant(variantId); // implement in service/repo (soft delete)
    res.json({ success: true, variant: updated });
  } catch (err) { next(err); }
}


async function listPublic(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const q = req.query.q ? String(req.query.q) : undefined;
    const result = await productService.listPublic({ page, limit, q });
    res.json({ success: true, items: result.items, total: result.total, page, limit });
  } catch (err) { next(err); }
}

async function listForUser(req, res, next) {
  try {
    // req.user set by verifyToken middleware
    const user = req.user || {};
    const role = (user.role || '').toString().toUpperCase();
    const userId = user.id || null;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const q = req.query.q ? String(req.query.q) : undefined;

    const result = await productService.listForUser({ page, limit, q, userId, role });
    res.json({ success: true, items: result.items, total: result.total, page, limit });
  } catch (err) { next(err); }
}

async function getProductPublic(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });

    const product = await productService.getProductPublic(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, product });
  } catch (err) { next(err); }
}

async function getProductForUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });

    const user = req.user || {};
    const role = (user.role || '').toString().toUpperCase();
    const userId = user.id || null;

    const product = await productService.getProductForUser({ productId: id, userId, role });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, product });
  } catch (err) { next(err); }
}



module.exports = {
  listPublic,
  listForUser,
  getProductPublic,
  getProductForUser,
  
    deleteVariant,
  deactivateVariant,
updateVariant,
  updateCategory, deleteCategory, getCategoryTree, getProductsByCategory ,
  recentlyViewedProducts,
  getTopSellingProducts,
  getRecentlyViewedProducts,
  getLowStockProducts,
  bulkUploadProducts,
  markProductFeatured,
  deleteProductCategories,
  deleteProduct,getProductsPaginated,updateProduct,getAllCategories, getAllProducts, createCategory, createProduct, createVariant, setPrice, updatePrice,getProductById };
