const { imageHash } = require('image-hash');
const { ValidationError } = require('errors');
const requestContext = require('talawa-request-context');

/**
 * This function determines whether a user is attempting to re-upload the same profile photo 
 * or an organisation is attempting to re-upload the same organisation image.
 * @param {File} imageJustUploadedPath Image that need to be uploaded.
 * @param {File} itemImage Current org/user image.
 * @returns {boolean} If the identical image is reuploaded, true; otherwise, false.
 */
module.exports = async (imageJustUploadedPath, itemImage) => {
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
