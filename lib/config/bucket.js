const AWS = require('aws-sdk');

const bucket = process.env.AWS_BUCKET_NAME;

const s3 = new AWS.S3({
  region: process.env.AWS_REGION_NAME,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.bucket = bucket;
exports.s3 = s3;
Footer