const { imageHash } = require('image-hash');
const { ValidationError } = require('../core/errors');
const requestContext = require('../core/libs/talawa-request-context');

module.exports = async (imageJustUploadedPath, itemImage) => {
  // This function checks whether a user is trying to re=upload the same profile picture or an org is trying to re-upload the same org image
  if (itemImage) {
    let oldImageHash;
    let newImageHash;
    await new Promise((resolve) => {
      imageHash(itemImage, 16, true, (error, data) => {
        if (error) oldImageHash = '';
        oldImageHash = data;
        resolve();
      });
    })
      .then(() => oldImageHash)
      .catch(() => {
        throw new ValidationError([
          {
            message: requestContext.translate('invalid.fileType'),
            code: 'invalid.fileType',
            param: 'fileType',
          },
        ]);
      });

    await new Promise((resolve) => {
      imageHash(imageJustUploadedPath, 16, true, (error, data) => {
        if (error) newImageHash = '';
        newImageHash = data;
        resolve();
      });
    })
      .then(() => newImageHash)
      .catch(() => {
        throw new ValidationError([
          {
            message: requestContext.translate('invalid.fileType'),
            code: 'invalid.fileType',
            param: 'fileType',
          },
        ]);
      });
    // console.log("old image hash: " + oldImageHash);
    // console.log("new image hash: " + newImageHash);
    return oldImageHash === newImageHash;
  }
  return false;
};
