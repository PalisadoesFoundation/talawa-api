export interface IError {
  message: string;
  code: string | null;
  param: string | null;
  metadata?: Record<any, any>;
}

export class ApplicationError extends Error {
  public errors: IError[];
  public httpCode: number;

  constructor(
    errors: IError[],
    httpCode: number = 422,
    message: string = 'Error'
  ) {
    super(message);
    this.errors = errors;
    this.httpCode = httpCode;
  }
}

export default ApplicationError;
