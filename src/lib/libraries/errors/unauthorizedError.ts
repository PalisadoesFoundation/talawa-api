import { ApplicationError } from "./applicationError";

export class UnauthorizedError extends ApplicationError {
  constructor(
    message: string = "UnauthorizedError",
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
    super(errorJson, 403, message);
  }
}
