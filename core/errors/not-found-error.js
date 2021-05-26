const ApplicationError = require('./application-error');

class NotFoundError extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'Not Found';
    const errorJson = [
      {
        message: errorMessage,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 404, errorMessage);
  }
}

module.exports = NotFoundError;
