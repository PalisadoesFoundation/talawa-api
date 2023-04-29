import type { InterfaceError } from "./applicationError";
import { ApplicationError } from "./applicationError";
/**
 * This class detects validation errors and sends those errors to the superclass ApplicationError.
 */
export class ValidationError extends ApplicationError {
  constructor(errors: InterfaceError[] = [], message = "Validation error") {
    super(errors, 422, message);
  }
}
