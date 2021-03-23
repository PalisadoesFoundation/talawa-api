'use strict';

module.exports = function AppError(message, httpStatus = 404) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.status = httpStatus;
  throw Error;
};

require('util').inherits(module.exports, Error);