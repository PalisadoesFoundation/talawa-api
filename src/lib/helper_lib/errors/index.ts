import { ApplicationError } from './application-error';
import { ConflictError } from './conflict-error';
import { InternalServerError } from './internal-server-error';
import { NotFoundError } from './not-found-error';
import { UnauthenticatedError } from './unauthenticated-error';
import { UnauthorizedError } from './unauthorized-error';
import { ValidationError } from './validation-error';

export default {
  // Base class
  ApplicationError,
  // Used for resource already present
  ConflictError,
  // Used for server fatal error
  InternalServerError,
  // Used for resource not found
  NotFoundError,
  // Used for invalid authentication token or wrong credentials
  UnauthenticatedError,
  // Used for user is forbidden to perform operation
  UnauthorizedError,
  // Used for basic sanity checks
  ValidationError,
};

export * from './application-error';
export * from './conflict-error';
export * from './internal-server-error';
export * from './not-found-error';
export * from './unauthenticated-error';
export * from './unauthorized-error';
export * from './validation-error';
