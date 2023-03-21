import { ApplicationError, Interface_Error } from "./applicationError";
/**
 * This class detects validation errors and sends those errors to the superclass ApplicationError.
 */
export class ValidationError extends ApplicationError {
  constructor(errors: Interface_Error[] = [], message = "Validation error") {
    super(errors, 422, message);
  }
}
