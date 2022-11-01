const deleteImage = require('./deleteImage');
const { ValidationError } = require('errors');
const requestContext = require('talawa-request-context');
/**
 * This function checks the extension of the file.
 * If the extension isn't of type 'png', or 'jpg', or 'jpeg',
 * then the file is deleted and a validation error is thrown.
 * @param {string} filename - Name of file
 */
module.exports = async (filename) => {
  const extension = filename.split('.').pop();
  if (extension !== 'png' && extension !== 'jpg' && extension !== 'jpeg') {
    await deleteImage(filename);
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
