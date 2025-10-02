// backend/services/categoryService.js

const categoryRepo = require('../repositories/categoryRepo');

async function updateCategory(id, name, parentCategoryId = null) {
  return categoryRepo.updateCategory(id, name, parentCategoryId);
}

async function deleteCategory(id) {
  return categoryRepo.deleteCategory(id);
}

async function getCategoryTree() {
  return categoryRepo.fetchCategoryTree();
}

async function getProductsByCategory(categoryId) {
  return categoryRepo.fetchProductsByCategory(categoryId);
}

module.exports = { updateCategory, deleteCategory, getCategoryTree, getProductsByCategory };
