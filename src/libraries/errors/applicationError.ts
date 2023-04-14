export interface InterfaceError {
  message: string;
  code: string | null;
  param: string | null;
  metadata?: Record<any, any>;
}
/**
 * This class is responsible for finding the application errors. It adds those errors to superclass called Error.
 */
export class ApplicationError extends Error {
  public errors: InterfaceError[];
  public httpCode: number;

  constructor(
    errors: InterfaceError[],
    httpCode = 422,
    message = "Error"
  ) {
    super(message);
    this.errors = errors;
    this.httpCode = httpCode;
  }
}
