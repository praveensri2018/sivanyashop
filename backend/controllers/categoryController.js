// backend/controllers/categoryController.js
const categoryService = require('../services/categoryService');

async function updateCategory(req, res, next) {
  try {
    const { name, parentCategoryId } = req.body;
    const category = await categoryService.updateCategory(req.params.id, name, parentCategoryId);
    res.json({ success: true, category });
  } catch (err) { next(err); }
}

async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
}

async function getCategoryTree(req, res, next) {
  try {
    const tree = await categoryService.getCategoryTree();
    res.json({ success: true, tree });
  } catch (err) { next(err); }
}

async function getProductsByCategory(req, res, next) {
  try {
    const products = await categoryService.getProductsByCategory(req.params.id);
    res.json({ success: true, products });
  } catch (err) { next(err); }
}

module.exports = { updateCategory, deleteCategory, getCategoryTree, getProductsByCategory };
