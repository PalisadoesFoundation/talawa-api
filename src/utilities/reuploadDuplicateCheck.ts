import { imageHash } from "image-hash";
import { requestContext, errors, logger } from "../libraries";

// Interface for URL request object
interface InterfaceUrlRequestObject {
  encoding?: string | null;
  url: string | null;
}

// Interface for Buffer object
interface InterfaceBufferObject {
  ext?: string;
  data: Buffer;
  name?: string;
}

// Type definition for image path, can be string, InterfaceUrlRequestObject, or InterfaceBufferObject
export type TypeImagePath =
  | string
  | InterfaceUrlRequestObject
  | InterfaceBufferObject;

/**
 * Gets the hash value of an image using the image-hash library.
 * @param oldSrc - Path of the image to hash, can be a string, URL request object, or buffer object.
 * @returns Promise that resolves to the hash object.
 */
const getImageHash = (oldSrc: TypeImagePath): object => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageHash(oldSrc, 16, true, (error: Error, data: any) => {
      if (error) {
        reject(error); // Reject promise if error occurs during hashing
      }
      resolve(data); // Resolve promise with hash data
    });
  });
};

/**
 * Checks if a user or organization is attempting to re-upload the same image.
 * @remarks
 * This is a utility method.
 * @param oldImagePath - Path of the current image (could be a string, URL request object, or buffer object).
 * @param newImagePath - Path of the new image being uploaded (could be a string, URL request object, or buffer object).
 * @returns Promise that resolves to true if the images are identical, false otherwise.
 */
export const reuploadDuplicateCheck = async (
  oldImagePath: TypeImagePath | null,
  newImagePath: TypeImagePath,
): Promise<boolean> => {
  try {
    if (oldImagePath) {
      // Calculate hash of old and new images
      const oldImageHash = await getImageHash(oldImagePath);
      const newImageHash = await getImageHash(newImagePath);

      // Compare hashes to determine if images are identical
      return oldImageHash === newImageHash;
    }

    // If oldImagePath is null, cannot be a duplicate upload
    return false;
  } catch (error) {
    logger.error(error); // Log error for debugging purposes

    // Throw a validation error with translated message
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate("invalid.fileType"),
          code: "invalid.fileType",
          param: "fileType",
        },
      ],
      requestContext.translate("invalid.fileType"),
    );
  }
};
