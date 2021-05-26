const errors = {};

errors.ApplicationError = require('./application-error');
errors.InternalServerError = require('./internal-server-error');
errors.NotFoundError = require('./not-found-error');
errors.UnauthorizedError = require('./unauthorized-error');
errors.ValidationError = require('./validation-error');
errors.UnauthenticatedError = require('./unauthenticated-error');
errors.ConflictError = require('./conflict-error');

module.exports = errors;
