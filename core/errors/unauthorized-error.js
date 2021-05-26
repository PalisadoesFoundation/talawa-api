const ApplicationError = require('./application-error');

class UnauthorizedError extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'UnauthorizedError';
    const errorJson = [
      {
        message: errorMessage,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 403, errorMessage);
  }
}

module.exports = UnauthorizedError;
