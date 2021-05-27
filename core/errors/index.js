const errors = {};

// Base class
errors.ApplicationError = require('./application-error');

// Used for server fatal error
errors.InternalServerError = require('./internal-server-error');
// Used for resource not found
errors.NotFoundError = require('./not-found-error');
// Used for user is forbidden to perform operation
errors.UnauthorizedError = require('./unauthorized-error');
// Used for basic sanity checks
errors.ValidationError = require('./validation-error');
// Used for invalid authentication token or wrong credentials
errors.UnauthenticatedError = require('./unauthenticated-error');
// Used for resource already present
errors.ConflictError = require('./conflict-error');

module.exports = errors;
