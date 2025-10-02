// => PLACE: backend/services/productImageService.js
const productImageRepo = require('../repositories/productImageRepo');
const { r2, BUCKET_NAME: R2_BUCKET, PUBLIC_URL: R2_PUBLIC_URL } = require('../lib/r2Client');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3'); // S3 compatible

/**
 * Delete product image: remove object from cloud R2 and then delete DB row.
 * Returns { message, warning? } where warning indicates cloud deletion problem.
 */
async function deleteProductImage(imageId, deletedByUserId = null) {
  // 1. fetch DB row (to know image URL and product link)
  const imageRow = await productImageRepo.getProductImageById(imageId);
  if (!imageRow) throw { status: 404, message: 'Image not found' };

  const imageUrl = imageRow.ImageUrl;
  let cloudDeleted = false;
  let cloudError = null;

  // 2. attempt to delete from R2 (if imageUrl exists)
  if (imageUrl) {
    try {
      // Determine the object key from the full public URL.
      // If PUBLIC_URL is configured, strip it; otherwise, extract pathname.
      let key = null;
      if (R2_PUBLIC_URL && imageUrl.startsWith(R2_PUBLIC_URL)) {
        // e.g., PUBLIC_URL = "https://bucket.example.com"
        key = imageUrl.substring(R2_PUBLIC_URL.length);
        if (key.startsWith('/')) key = key.substring(1);
      } else {
        // fallback: parse URL and take pathname without leading slash
        try {
          const parsed = new URL(imageUrl);
          key = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname;
        } catch (e) {
          // If URL parsing fails, try heuristic: last segment
          const parts = imageUrl.split('/');
          key = parts.slice(3).join('/'); // try to remove protocol+host
          if (!key) key = parts[parts.length - 1];
        }
      }

      if (!key) throw new Error('Could not determine cloud object key from URL');

      // send delete
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      cloudDeleted = true;
    } catch (err) {
      // Log error and continue to DB cleanup. Return warning to caller.
      console.error('R2 cloud delete error:', err);
      cloudError = err.message || String(err);
      cloudDeleted = false;
    }
  }

  // 3. delete DB row (still attempt regardless of cloud result)
  await productImageRepo.deleteProductImageById(imageId);

  // 4. return result summarizing actions
  if (cloudDeleted) {
    return { message: 'Image deleted from cloud and database.' };
  } else {
    return {
      message: 'Image removed from database.',
      warning: 'Failed to delete image from cloud storage.',
      cloudError
    };
  }
}

module.exports = {
  deleteProductImage,
  // keep export of upload service if exists...
};
