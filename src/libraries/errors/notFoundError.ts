import { ApplicationError } from "./applicationError";

/**
 * Represents a "Not Found" error. It extends the ApplicationError class
 * and is used to handle situations where a requested resource is not found.
 */
export class NotFoundError extends ApplicationError {
  /**
   * Creates an instance of NotFoundError.
   * @param message - The error message. Defaults to "Not Found".
   * @param code - The error code. Can be null. Defaults to null.
   * @param param - The parameter related to the error. Can be null. Defaults to null.
   * @param metadata - Additional metadata related to the error. Defaults to an empty object.
   */
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
