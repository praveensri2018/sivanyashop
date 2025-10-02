const { uploadToR2 } = require('../middleware/uploadMiddleware');
const productImageRepo = require('../repositories/productImageRepo');
const productImageService = require('../services/productImageService'); 

async function uploadProductImages(req, res, next) {
  try {
    const productId = parseInt(req.body.productId);
    if (!productId) return res.status(400).json({ success: false, message: 'ProductId is required' });

    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });

    const savedImages = [];
    for (const file of files) {
      const imageUrl = await uploadToR2(file); // this now returns PUBLIC_URL
      const image = await productImageRepo.addProductImage(productId, imageUrl);
      savedImages.push(image);
    }

    res.json({ success: true, images: savedImages });
  } catch (err) {
    next(err);
  }
}

async function deleteProductImage(req, res, next) {
  try {
    const imageId = parseInt(req.params.id, 10);
    if (isNaN(imageId)) {
      return res.status(400).json({ success: false, message: 'Invalid image id' });
    }

    // pass user id for audit if you want (optional)
    const result = await productImageService.deleteProductImage(imageId, req.user && req.user.id);

    // result may contain warning if cloud delete failed
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadProductImages,deleteProductImage };
