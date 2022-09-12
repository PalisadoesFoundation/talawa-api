export interface Interface_Error {
  message: string;
  code: string | null;
  param: string | null;
  metadata?: Record<any, any>;
}

export class ApplicationError extends Error {
  public errors: Interface_Error[];
  public httpCode: number;

  constructor(
    errors: Interface_Error[],
    httpCode: number = 422,
    message: string = 'Error'
  ) {
    super(message);
    this.errors = errors;
    this.httpCode = httpCode;
  }
}
