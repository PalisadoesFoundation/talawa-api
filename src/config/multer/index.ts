import multer from "multer";
import {
  VIDEO_SIZE_LIMIT,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  INVALID_FILE_TYPE,
} from "../../constants";
import type { Request } from "express";
import { errors, requestContext } from "../../libraries";

/**
 * File filter function for multer.
 *
 * This function checks the MIME type of the uploaded file against allowed image and video types.
 * If the file type is valid, it calls the callback with `true`. Otherwise, it calls the callback
 * with an error message.
 *
 * @param req - The Express request object.
 * @param file - The file being uploaded.
 * @param cb - The callback function to indicate if the file is accepted or rejected.
 *
 * @example
 * ```typescript
 * fileFilter(req, file, cb);
 * ```
 */
export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new errors.InvalidFileTypeError(
        requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
        INVALID_FILE_TYPE.CODE,
        INVALID_FILE_TYPE.PARAM,
      ),
    );
  }
};

/**
 * Multer upload configuration.
 *
 * This configuration sets up multer to use memory storage, applies the file filter,
 * and sets a file size limit for uploads.
 *
 * @returns A multer instance configured for handling uploads.
 *
 * @example
 * ```typescript
 * const uploadMiddleware = upload.single("file");
 * app.post("/upload", uploadMiddleware, (req, res) => {
 *   res.send("File uploaded successfully!");
 * });
 * ```
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: VIDEO_SIZE_LIMIT + 2,
  },
});
