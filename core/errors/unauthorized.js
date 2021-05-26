const ApplicationError = require('./application-error');

class Unauthorized extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'Unauthorized';
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

module.exports = Unauthorized;
