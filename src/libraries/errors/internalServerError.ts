import { ApplicationError } from "./applicationError";

/**
 * This class represents an error indicating an internal server error.
 * It extends the ApplicationError class to handle and format the error information.
 */
export class InternalServerError extends ApplicationError {
  /**
   * Creates an instance of InternalServerError.
   *
   * @param message - The error message (default is "Internal Server Error!").
   * @param code - Optional error code (default is null).
   * @param param - Optional parameter associated with the error (default is null).
   * @param metadata - Optional additional metadata associated with the error (default is an empty object).
   */
  constructor(
    message = "Internal Server Error!",
    code: string | null = null,
    param: string | null = null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<any, any> = {},
  ) {
    // Construct the error JSON in the required format for ApplicationError
    const errorJson = [
      {
        message,
        code,
        param,
        metadata,
      },
    ];

    // Call the superclass ApplicationError constructor with the formatted error JSON
    super(errorJson, 500, message);
  }
}
