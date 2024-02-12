import { ApplicationError } from "./applicationError";
/**
 * This class detects invalid file type errors and sends those errors to the superclass ApplicationError.
 */
export class ImageSizeLimitExceeded extends ApplicationError {
  constructor(
    message = "Image Size Limit Exceeded",
    code: string | null = null,
    param: string | null = null,
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
