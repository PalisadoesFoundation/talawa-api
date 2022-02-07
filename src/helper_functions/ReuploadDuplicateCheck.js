const { imageHash } = require('image-hash');
const { ValidationError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (imageJustUploadedPath, itemImage) => {
  // This function checks whether a user is trying to re=upload the same profile picture or an org is trying to re-upload the same org image
  try {
    if (itemImage) {
      const getImageHash = (oldSrc) => {
        return new Promise((resolve, reject) => {
          imageHash(oldSrc, 16, true, (error, data) => {
            if (error) reject(error);
            resolve(data);
          });
        });
      };
      let oldImageHash = await getImageHash(itemImage);
      let newImageHash = await getImageHash(imageJustUploadedPath);
      return oldImageHash === newImageHash;
    }
    return false;
  } catch (e) {
    console.log(e);
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
  }
};
