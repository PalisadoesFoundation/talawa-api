const ApplicationError = require('./application-error');

class ValidationError extends ApplicationError {
  constructor(errors, message) {
    super(errors || [], 422, message || 'Validation error');
  }
}

module.exports = ValidationError;
