import { ApplicationError } from "./applicationError";
/**
 * This class detects conflict errors and sends those errors to the superclass ApplicationError.
 */
export class ConflictError extends ApplicationError {
  constructor(
    message = "Conflicting entry found",
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
    super(errorJson, 409, message);
  }
}
