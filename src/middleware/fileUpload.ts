import type { Request, Response, NextFunction, RequestHandler } from "express";
import multer from "multer";

import { upload } from "../config/multer";
import {
  ALLOWED_IMAGE_TYPES,
  CONTENT_TYPE_SHOULD_BE_MULTIPART_FORM_DATA,
  FILE_SIZE_EXCEEDED,
  IMAGE_SIZE_LIMIT,
  INVALID_FILE_FIELD_NAME,
  VIDEO_SIZE_LIMIT,
} from "../constants";
import { requestContext } from "../libraries";

/**
 * A middleware for handling optional file uploads.
 * All data must be sent as multipart/form-data, but the file field is optional.
 *
 * @param fieldName - The name of the file field in the form
 * @returns Express middleware for handling file upload
 */
export const fileUpload = (fieldName: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Validate content type is multipart/form-data
    const contentType = req.get("content-type");
    if (contentType && !contentType.includes("multipart/form-data")) {
      res.status(400).json({
        error: requestContext.translate(
          CONTENT_TYPE_SHOULD_BE_MULTIPART_FORM_DATA.MESSAGE,
        ),
      });
      return;
    }

    // Handle file upload
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          res.status(400).json({
            error: requestContext.translate(INVALID_FILE_FIELD_NAME.MESSAGE),
          });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      } else if (err) {
        res.status(500).json({ error: "File upload failed" });
        return;
      }

      // If no file uploaded, continue
      if (!req.file) {
        next();
        return;
      }

      // Validate file size if file was uploaded
      const isImage = ALLOWED_IMAGE_TYPES.includes(req.file.mimetype);
      const sizeLimit = isImage ? IMAGE_SIZE_LIMIT : VIDEO_SIZE_LIMIT;

      if (req.file.size > sizeLimit) {
        const typeStr = isImage ? "Image" : "Video";
        const sizeMB = sizeLimit / (1024 * 1024);
        res.status(400).json({
          error: requestContext.translate(FILE_SIZE_EXCEEDED.MESSAGE),
          description: `${typeStr} size exceeds the limit of ${sizeMB}MB`,
        });
        return;
      }

      next();
    });
  };
};
