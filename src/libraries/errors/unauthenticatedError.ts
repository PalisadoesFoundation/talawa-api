import { ApplicationError } from "./applicationError";
/**
 * This class detects unauthenticated errors and sends those errors to the superclass ApplicationError.
 */
export class UnauthenticatedError extends ApplicationError {
  constructor(
    message = "UnauthenticatedError",
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
    super(errorJson, 401, message);
  }
}
