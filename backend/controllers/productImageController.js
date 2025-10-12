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
      // PLACE: upload file to R2 (this returns the public URL string)
      const imageUrl = await uploadToR2(file); // this now returns PUBLIC_URL

      // PLACE: insert DB record (returns { Id: <insertedId> } currently)
      const image = await productImageRepo.addProductImage(productId, imageUrl);

      // PLACE: push a richer object (include ImageUrl, filename etc) so frontend can show the image immediately
      savedImages.push({
        Id: image?.Id ?? image?.id ?? null,   // preserve whatever ID shape your repo returns
        ImageUrl: imageUrl,                  // <-- IMPORTANT: frontend looks for ImageUrl / imageUrl / url
        filename: file.originalname,         // optional: useful for the UI
        createdAt: new Date().toISOString()  // optional metadata
      });
    }

    // PLACE: return success and the enriched image objects
    return res.json({ success: true, images: savedImages });
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
