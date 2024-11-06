import type { Request, Response } from "express";

import { uploadMedia } from "../minio";
import { createFile } from "./createFile";
import { BUCKET_NAME } from "../../../config/minio";

import { isValidMimeType } from "../../../utilities/isValidMimeType";

import type { InterfaceFile } from "../../../models";
import { errors, requestContext } from "../../../libraries";
import {
  FILE_NOT_FOUND,
  INTERNAL_SERVER_ERROR,
  INVALID_FILE_TYPE,
} from "../../../constants";

export interface InterfaceUploadedFileResponse extends Partial<InterfaceFile> {
  objectKey: string;
}

/**
 * Handles file upload.
 * @param req - The HTTP request object containing the file.
 * @param res - The HTTP response object used to send the response.
 * @throws Error - Throws an error if no file is uploaded or if the file type is invalid.
 * @returns UploadedFileResponse - The response containing file ID and object key.
 */
export const uploadFile = async (
  req: Request,
  res: Response,
): Promise<InterfaceUploadedFileResponse> => {
  if (!req.file) {
    res
      .status(400)
      .json({ error: requestContext.translate(FILE_NOT_FOUND.MESSAGE) });
    throw new errors.InputValidationError(
      requestContext.translate(FILE_NOT_FOUND.MESSAGE),
      FILE_NOT_FOUND.CODE,
    );
  }

  const { mimetype, originalname, buffer, size } = req.file;

  if (!isValidMimeType(mimetype)) {
    throw new errors.InputValidationError(
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
      INVALID_FILE_TYPE.CODE,
    );
  }

  try {
    const contentType = { ContentType: mimetype };
    const uploadedFile = await uploadMedia(
      BUCKET_NAME as string,
      buffer,
      originalname,
      contentType,
    );
    const fileDoc = await createFile(
      uploadedFile,
      originalname,
      mimetype,
      size,
    );

    return {
      uri: fileDoc.uri,
      _id: fileDoc._id,
      visibility: fileDoc.visibility,
      objectKey: fileDoc.metadata.objectKey,
    };
  } catch (error) {
    console.error("Error", error);
    throw new errors.InternalServerError(
      requestContext.translate(INTERNAL_SERVER_ERROR.MESSAGE),
      INTERNAL_SERVER_ERROR.CODE,
    );
  }
};
