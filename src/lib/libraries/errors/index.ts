import { ApplicationError } from "./applicationError";
import { ConflictError } from "./conflictError";
import { InternalServerError } from "./internalServerError";
import { NotFoundError } from "./notFoundError";
import { UnauthenticatedError } from "./unauthenticatedError";
import { UnauthorizedError } from "./unauthorizedError";
import { ValidationError } from "./validationError";

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

export * from "./applicationError";
export * from "./conflictError";
export * from "./internalServerError";
export * from "./notFoundError";
export * from "./unauthenticatedError";
export * from "./unauthorizedError";
export * from "./validationError";
