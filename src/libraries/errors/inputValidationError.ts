import { ApplicationError } from "./applicationError";

/**
 * Represents an input validation error. It extends the ApplicationError class
 * and is used to handle errors related to input validation failures.
 */
export class InputValidationError extends ApplicationError {
  /**
   * Creates an instance of InputValidationError.
   * @param message - The error message. Defaults to "InputValidationError".
   * @param code - The error code. Can be null. Defaults to null.
   * @param param - The parameter related to the error. Can be null. Defaults to null.
   * @param metadata - Additional metadata related to the error. Defaults to an empty object.
   */
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
