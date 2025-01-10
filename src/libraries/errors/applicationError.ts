/**
 * Interface representing the structure of an error.
 */
export interface InterfaceError {
  /** The error message */
  message: string;
  /** The error code, can be null */
  code: string | null;
  /** The parameter associated with the error, can be null */
  param: string | null;
  /** Optional additional metadata associated with the error */
  metadata?: Record<string, string>;
}

/**
 * This class is responsible for handling application errors.
 * It extends the built-in Error class to include additional properties and methods.
 */
export class ApplicationError extends Error {
  /** An array of errors conforming to the InterfaceError interface */
  public errors: InterfaceError[];
  /** The HTTP status code associated with the error */
  public httpCode;

  /**
   * Creates an instance of ApplicationError.
   *
   * @param errors - An array of errors conforming to the InterfaceError interface.
   * @param httpCode - The HTTP status code associated with the error (default is 422).
   * @param message - The error message (default is "Error").
   */
  constructor(errors: InterfaceError[], httpCode = 422, message = "Error") {
    super(message); // Call the constructor of the superclass Error
    this.errors = errors; // Assign the errors to the instance
    this.httpCode = httpCode; // Assign the HTTP status code to the instance
  }
}
