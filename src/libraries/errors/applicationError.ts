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
    httpCode: number = 422,
    message: string = "Error"
  ) {
    super(message);
    this.errors = errors;
    this.httpCode = httpCode;
  }
}
