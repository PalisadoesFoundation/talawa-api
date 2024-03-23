export interface InterfaceError {
  message: string;
  code: string | null;
  param: string | null;
  metadata?: Record<string, string>;
}
/**
 * This class is responsible for finding the application errors. It adds those errors to superclass called Error.
 */
export class ApplicationError extends Error {
  public errors: InterfaceError[];
  public httpCode;

  constructor(errors: InterfaceError[], httpCode = 422, message = "Error") {
    super(message);
    this.errors = errors;
    this.httpCode = httpCode;
  }
}
