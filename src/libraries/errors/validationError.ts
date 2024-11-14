import type { InterfaceError } from "./applicationError";
import { ApplicationError } from "./applicationError";

/**
 * This class represents an error indicating validation errors.
 * It extends the ApplicationError class to handle and format the error information.
 */
export class ValidationError extends ApplicationError {
  /**
   * Creates an instance of ValidationError.
   *
   * @param errors - An array of errors conforming to the InterfaceError interface (default is an empty array).
   * @param message - The error message (default is "Validation error").
   */
  constructor(errors: InterfaceError[] = [], message = "Validation error") {
    // Call the superclass ApplicationError constructor with the provided errors and HTTP status code
    super(errors, 422, message);
  }
}
