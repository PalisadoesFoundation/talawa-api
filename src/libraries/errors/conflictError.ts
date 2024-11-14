import { ApplicationError } from "./applicationError";

/**
 * This class represents a conflict error. It extends the ApplicationError class
 * and is used to handle situations where a conflicting entry is found.
 */
export class ConflictError extends ApplicationError {
  /**
   * Creates an instance of ConflictError.
   * @param message - The error message. Defaults to "Conflicting entry found".
   * @param code - The error code. Can be null. Defaults to null.
   * @param param - The parameter related to the error. Can be null. Defaults to null.
   * @param metadata - Additional metadata related to the error. Defaults to an empty object.
   */
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
