// @/src/modules/streams.js
const stream = require('stream');

const { s3, bucket } = require('../config/bucket');

const createUploadStream = (key) => {
  const pass = new stream.PassThrough();
  return {
    writeStream: pass,
    promise: s3
      .upload({
        Bucket: bucket,
        Key: key,
        Body: pass,
      })
      .promise(),
  };
};

module.exports = createUploadStream;