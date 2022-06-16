import ApplicationError from './application-error';

export class NotFoundError extends ApplicationError {
  constructor(
    message: string = 'Not Found',
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
    super(errorJson, 404, message);
  }
}

export default NotFoundError;
