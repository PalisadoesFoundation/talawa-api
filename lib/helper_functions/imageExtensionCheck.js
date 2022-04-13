const deleteImage = require('./deleteImage');
const { ValidationError } = require('errors');
const {
  INVALID_FILE_TYPE_CODE,
  INVALID_FILE_TYPE_MESSAGE,
  INVALID_FILE_TYPE_PARAM,
} = require('../../constants');
const requestContext = require('talawa-request-context');

module.exports = async (filename) => {
  const extension = filename.split('.').pop();
  if (extension !== 'png' && extension !== 'jpg' && extension !== 'jpeg') {
    await deleteImage(filename);
    throw new ValidationError(
      [
        {
          message: requestContext.translate(INVALID_FILE_TYPE_MESSAGE),
          code: INVALID_FILE_TYPE_CODE,
          param: INVALID_FILE_TYPE_PARAM,
        },
      ],
      requestContext.translate(INVALID_FILE_TYPE_MESSAGE)
    );
  }
};
