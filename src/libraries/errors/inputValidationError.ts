import { ApplicationError } from "./applicationError";

export class InputValidationError extends ApplicationError {
  constructor(
    message: string = "InputValidationError",
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
    super(errorJson, 422, message);
  }
}
