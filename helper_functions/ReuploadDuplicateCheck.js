const { imageHash } = require('image-hash');
const { ValidationError } = require('errors');
const requestContext = require('talawa-request-context');

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
        throw new ValidationError(
          [
            {
              message: requestContext.translate('invalid.fileType'),
              code: 'invalid.fileType',
              param: 'fileType',
            },
          ],
          requestContext.translate('invalid.fileType')
        );
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
        throw new ValidationError(
          [
            {
              message: requestContext.translate('invalid.fileType'),
              code: 'invalid.fileType',
              param: 'fileType',
            },
          ],
          requestContext.translate('invalid.fileType')
        );
      });
    return oldImageHash === newImageHash;
  }
  return false;
};
