import { ApplicationError, Interface_Error } from './application-error';

export class ValidationError extends ApplicationError {
  constructor(
    errors: Interface_Error[] = [],
    message: string = 'Validation error'
  ) {
    super(errors, 422, message);
  }
}
