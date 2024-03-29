import { ApplicationError } from "./applicationError";
/**
 * This class detects Not Found errors and sends those errors to the superclass ApplicationError.
 */
export class NotFoundError extends ApplicationError {
  constructor(
    message = "Not Found",
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
    super(errorJson, 404, message);
  }
}
