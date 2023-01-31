import { imageHash } from "image-hash";
import { requestContext, errors, logger } from "../libraries";

interface UrlRequestObject {
  encoding?: string | null;
  url: string | null;
}

interface BufferObject {
  ext?: string;
  data: Buffer;
  name?: string;
}

export type Type_ImagePath = string | UrlRequestObject | BufferObject;

const getImageHash = (oldSrc: Type_ImagePath) => {
  return new Promise((resolve, reject) => {
    imageHash(oldSrc, 16, true, (error: Error, data: any) => {
      if (error) {
        reject(error);
      }

      resolve(data);
    });
  });
};

export const reuploadDuplicateCheck = async (
  oldImagePath: Type_ImagePath | null,
  newImagePath: Type_ImagePath
) => {
  /*
  This function checks whether a user is trying to re-upload the same profile picture
  or an organization is trying to re-upload the same organization image 
  */
  try {
    if (oldImagePath) {
      const oldImageHash = await getImageHash(oldImagePath);

      const newImageHash = await getImageHash(newImagePath);

      return oldImageHash === newImageHash;
    }

    return false;
  } catch (error) {
    logger.error(error);

    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate("invalid.fileType"),
          code: "invalid.fileType",
          param: "fileType",
        },
      ],
      requestContext.translate("invalid.fileType")
    );
  }
};
