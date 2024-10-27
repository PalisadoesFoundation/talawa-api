import type express from "express";
import type { Response } from "express";
import multer from "multer";
import { requestContext } from "../libraries";
import { INVALID_ARGUMENT_RECEIVED } from "../constants";

/**
 * Middleware to handle errors from multer.
 *
 * This middleware checks if the error is an instance of `MulterError` and
 * specifically if it is due to an unexpected file upload limit. If so, it responds
 * with a 400 status code and an error message. If the error is not related to multer,
 * it passes the error to the next middleware for further handling.
 *
 * @param err - The error object received from multer or other middleware.
 * @param _req - The Express request object (not used).
 * @param res - The Express response object.
 * @param next - The next middleware function to call.
 *
 * @returns A JSON response with an error message if the error is a `MulterError` related to unexpected file limit; otherwise, it forwards the error to the next middleware.
 *
 * @example
 * ```typescript
 * app.post("/upload", upload.single("file"), multerErrorHandler, (req, res) => {
 *   res.send("File uploaded successfully!");
 * });
 * ```
 */
export const multerErrorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Response | undefined => {
  if (
    err instanceof multer.MulterError &&
    err.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    return res.status(400).json({
      error: requestContext.translate(INVALID_ARGUMENT_RECEIVED.MESSAGE),
    });
  }
  next(err);
};
