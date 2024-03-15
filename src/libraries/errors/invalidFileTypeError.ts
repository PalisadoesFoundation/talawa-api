import { ApplicationError } from "./applicationError";
/**
 * This class detects invalid file type errors and sends those errors to the superclass ApplicationError.
 */
export class InvalidFileTypeError extends ApplicationError {
  constructor(
    message = "Invalid File Type",
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
