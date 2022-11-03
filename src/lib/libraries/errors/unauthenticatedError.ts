import { ApplicationError } from "./applicationError";

export class UnauthenticatedError extends ApplicationError {
  constructor(
    message: string = "UnauthenticatedError",
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
    super(errorJson, 401, message);
  }
}
