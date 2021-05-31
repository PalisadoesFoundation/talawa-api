const deleteImage = require('./deleteImage');
const { ValidationError } = require('errors');
const requestContext = require('talawa-request-context');

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
