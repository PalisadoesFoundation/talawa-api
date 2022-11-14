import { ApplicationError } from "./applicationError";
/**
 * This class detects internal server errors and sends those errors to the superclass ApplicationError.
 */
export class InternalServerError extends ApplicationError {
  constructor(
    message: string = "Internal Server Error!",
    code: string | null = null,
    param: string | null = null,
    metadata: Record<any, any> = {}
  ) {
    const errorJson = [
      {
        message,
        code,
        param,
        metadata,
      },
    ];
    super(errorJson, 500, message);
  }
}
