import { imageHash } from "image-hash";
import { requestContext, errors } from "../libraries";

// structure for UrlRequestObject.
interface UrlRequestObject {
  encoding?: string | null;
  url: string | null;
}

// structure for BufferObject.
interface BufferObject {
  ext?: string;
  data: Buffer;
  name?: string;
}

// defining type for Type_ImagePath variable.
export type Type_ImagePath = string | UrlRequestObject | BufferObject;

// This function returns the image hash.
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

/**
 * This function determines whether a user or an organisation is 
 * attempting to re-upload the same profile photo or organisation image.
 *
 * @remarks
 * This is a utility method.
 *
 * @param oldImagePath - Path of a current Org/User image of `type: Type_ImagePath`.
 * @param newImagePath - Path of a new image of `type: Type_ImagePath`.
 * @returns If the identical image is trying to reuploaded, `true`; otherwise, `false`.
 */
export const reuploadDuplicateCheck = async (
  oldImagePath: Type_ImagePath | null,
  newImagePath: Type_ImagePath
) => {
  try {
    if (oldImagePath) {
      const oldImageHash = await getImageHash(oldImagePath);

      const newImageHash = await getImageHash(newImagePath);

      return oldImageHash === newImageHash;
    }

    return false;
  } catch (error) {
    console.error(error);

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
