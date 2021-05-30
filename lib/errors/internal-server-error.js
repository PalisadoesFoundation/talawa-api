const ApplicationError = require('./application-error');

class InternalServerError extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'Internal Server Error!';

    const errorJson = [
      {
        message: errorMessage,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 500, errorMessage);
  }
}

module.exports = InternalServerError;
