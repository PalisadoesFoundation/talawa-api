const ApplicationError = require('./application-error');

class ValidationError extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'Validation error';
    const errorJson = [
      {
        message: errorMessage,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 422, errorMessage);
  }
}

module.exports = ValidationError;
