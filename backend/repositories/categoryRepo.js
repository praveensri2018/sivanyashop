// backend/repositories/categoryRepo.js
const { query, sql } = require('../lib/db');

async function updateCategory(id, name, parentCategoryId) {
  await query(
    'UPDATE dbo.Categories SET Name=@name, ParentCategoryId=@parentCategoryId WHERE Id=@id',
    {
      id: { type: sql.Int, value: id },
      name: { type: sql.NVarChar, value: name },
      parentCategoryId: { type: sql.Int, value: parentCategoryId }
    }
  );
  return { id, name, parentCategoryId };
}

async function deleteCategory(id) {
  await query('DELETE FROM dbo.Categories WHERE Id=@id', { id: { type: sql.Int, value: id } });
}

async function fetchCategoryTree() {
  const result = await query(`
    WITH CategoryCTE AS (
      SELECT Id, Name, ParentCategoryId
      FROM dbo.Categories
      WHERE ParentCategoryId IS NULL
      UNION ALL
      SELECT c.Id, c.Name, c.ParentCategoryId
      FROM dbo.Categories c
      INNER JOIN CategoryCTE p ON c.ParentCategoryId = p.Id
    )
    SELECT * FROM CategoryCTE
  `);
  return result.recordset;
}

async function fetchProductsByCategory(categoryId) {
  const result = await query(`
    SELECT p.*
    FROM dbo.Products p
    INNER JOIN dbo.ProductCategories pc ON p.Id = pc.ProductId
    WHERE pc.CategoryId = @categoryId
  `, { categoryId: { type: sql.Int, value: categoryId } });
  return result.recordset;
}

module.exports = { updateCategory, deleteCategory, fetchCategoryTree, fetchProductsByCategory };