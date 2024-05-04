import { ApplicationError } from "./applicationError";
/**
 * This class detects input validation errors and sends those errors to the superclass ApplicationError.
 */
export class InputValidationError extends ApplicationError {
  constructor(
    message = "InputValidationError",
    code: string | null = null,
    param: string | null = null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<any, any> = {},
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
