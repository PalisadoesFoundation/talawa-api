import ApplicationError from './application-error';

export class ConflictError extends ApplicationError {
  constructor(
    message: string = 'Conflicting entry found',
    code: string | null = null,
    param: string | null = null,
    metadata: Record<any, any> = {}
  ) {
    const errorJson = [
      {
        message,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 409, message);
  }
}

export default ConflictError;
