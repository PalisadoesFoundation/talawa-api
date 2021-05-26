const ApplicationError = require('./application-error');

class Unauthenticated extends ApplicationError {
  constructor(message, code = null, param = null, metadata = {}) {
    const errorMessage = message || 'Unauthenticated';
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

module.exports = Unauthenticated;
