const ApplicationError = require('./application-error');

class ConflictError extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'Conflicting entry found';
    const errorJson = [
      {
        message: errorMessage,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 409, errorMessage);
  }
}

module.exports = ConflictError;
