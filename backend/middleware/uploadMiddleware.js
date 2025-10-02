const multer = require('multer');
const { Upload } = require('@aws-sdk/lib-storage');
const { r2, BUCKET_NAME, PUBLIC_URL } = require('../lib/r2Client');
const crypto = require('crypto');

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function uploadToR2(file) {
  const fileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${file.originalname}`;

  const parallelUploads3 = new Upload({
    client: r2,
    params: {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read'
    }
  });

  await parallelUploads3.done();

  // ✅ Return the Public Development URL
  return `${PUBLIC_URL}/${fileName}`;
}

module.exports = { upload, uploadToR2 };
