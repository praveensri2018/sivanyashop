// backend/lib/r2Client.js
const { S3Client } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-3ed714feea6f436980a84d39f670619c.r2.dev

module.exports = { r2, BUCKET_NAME, PUBLIC_URL };