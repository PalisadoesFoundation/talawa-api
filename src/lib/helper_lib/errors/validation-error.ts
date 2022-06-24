import { ApplicationError, IError } from './application-error';

export class ValidationError extends ApplicationError {
  constructor(errors: IError[] = [], message: string = 'Validation error') {
    super(errors, 422, message);
  }
}
