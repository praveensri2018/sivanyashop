const express = require('express');
const router = express.Router();
const { verifyToken, ensureAdmin } = require('../middleware/authMiddleware');
const { upload, uploadToR2 } = require('../middleware/uploadMiddleware');
const { uploadProductImages } = require('../controllers/productImageController');

router.post('/upload', verifyToken, ensureAdmin, upload.array('images', 5), uploadProductImages);

module.exports = router;
