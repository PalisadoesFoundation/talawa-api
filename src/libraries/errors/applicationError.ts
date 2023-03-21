export interface Interface_Error {
  message: string;
  code: string | null;
  param: string | null;
  metadata?: Record<any, any>;
}
/**
 * This class is responsible for finding the application errors. It adds those errors to superclass called Error.
 */
export class ApplicationError extends Error {
  public errors: Interface_Error[];
  public httpCode: number;

  constructor(
    errors: Interface_Error[],
    httpCode = 422,
    message = "Error"
  ) {
    super(message);
    this.errors = errors;
    this.httpCode = httpCode;
  }
}
