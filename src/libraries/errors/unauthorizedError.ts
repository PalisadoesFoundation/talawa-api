import { ApplicationError } from "./applicationError";

/**
 * Represents an unauthorized error. It extends the ApplicationError class
 * and is used to handle situations where access to a resource is unauthorized.
 */
export class UnauthorizedError extends ApplicationError {
  /**
   * Creates an instance of UnauthorizedError.
   * @param message - The error message. Defaults to "UnauthorizedError".
   * @param code - The error code. Can be null. Defaults to null.
   * @param param - The parameter related to the error. Can be null. Defaults to null.
   * @param metadata - Additional metadata related to the error. Defaults to an empty object.
   */
  constructor(
    message = "UnauthorizedError",
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
    super(errorJson, 403, message);
  }
}
