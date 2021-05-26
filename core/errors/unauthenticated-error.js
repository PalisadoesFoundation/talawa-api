const ApplicationError = require('./application-error');

class UnauthenticatedError extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'UnauthenticatedError';
    const errorJson = [
      {
        message: errorMessage,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 401, errorMessage);
  }
}

module.exports = UnauthenticatedError;
