const errors = {};

errors.ApplicationError = require('./application-error');
errors.InternalServerError = require('./internal-server-error');
errors.NotFound = require('./not-found');
errors.Unauthorized = require('./unauthorized');
errors.ValidationError = require('./validation-error');
errors.Unauthenticated = require('./unauthenticated');
errors.ConflictError = require('./conflict-error');

module.exports = errors;
