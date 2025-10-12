// => PLACE: backend/routes/product.js
const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });


router.get('/public', productController.listPublic);          // paginated public listing
router.get('/public/:id', productController.getProductPublic); // public product details

// AUTHENTICATED endpoints (token required)
router.get('/user', verifyToken, productController.listForUser);        // paginated authenticated listing (user-based pricing)
router.get('/user/:id', verifyToken, productController.getProductForUser)


router.delete('/variant/:id', verifyToken, ensureAdmin, productController.deleteVariant);
router.put('/variant/:id/deactivate', verifyToken, ensureAdmin, productController.deactivateVariant);

router.get('/getdetails/:id', verifyToken, ensureAdmin, productController.getProductById);
router.put('/variant/:id', verifyToken, ensureAdmin, productController.updateVariant);

// Admin-only product management
router.post('/category', verifyToken, ensureAdmin, productController.createCategory);
router.post('/product', verifyToken, ensureAdmin, productController.createProduct);
router.post('/variant', verifyToken, ensureAdmin, productController.createVariant);
router.post('/variant/price', verifyToken, ensureAdmin, productController.setPrice);
router.put('/variant/price', verifyToken, ensureAdmin, productController.updatePrice);
router.get('/all', verifyToken, ensureAdmin, productController.getAllProducts);
router.get('/categories', verifyToken, ensureAdmin, productController.getAllCategories);
router.put('/product/:id', verifyToken, ensureAdmin, productController.updateProduct);
router.get('/', verifyToken, ensureAdmin, productController.getProductsPaginated);
router.delete('/:id', verifyToken, ensureAdmin, productController.deleteProduct);
router.delete('/:id/categories', verifyToken, ensureAdmin, productController.deleteProductCategories);

router.put('/category/:id', verifyToken, ensureAdmin, productController.updateCategory);
router.delete('/category/:id', verifyToken, ensureAdmin, productController.deleteCategory);

router.get('/top-selling', verifyToken, ensureAdmin, productController.getTopSellingProducts);
//router.get('/recently-viewed', verifyToken, productController.getRecentlyViewedProducts);
router.get('/low-stock', verifyToken, ensureAdmin, productController.getLowStockProducts);
router.post('/bulk-upload', verifyToken, ensureAdmin, upload.single('file'), productController.bulkUploadProducts);
router.put('/:id/feature', verifyToken, ensureAdmin, productController.markProductFeatured);
router.get('/recently-viewed', verifyToken, productController.recentlyViewedProducts);

module.exports = router;
