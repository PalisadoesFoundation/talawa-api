import { imageHash } from "image-hash";
import { requestContext, errors, logger } from "../libraries";

interface InterfaceUrlRequestObject {
  encoding?: string | null;
  url: string | null;
}

interface InterfaceBufferObject {
  ext?: string;
  data: Buffer;
  name?: string;
}

export type TypeImagePath =
  | string
  | InterfaceUrlRequestObject
  | InterfaceBufferObject;

const getImageHash = (oldSrc: TypeImagePath): object => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * @param oldImagePath - Path of a current Org/User image of `type: TypeImagePath`.
 * @param newImagePath - Path of a new image of `type: TypeImagePath`.
 * @returns If the identical image is trying to reuploaded, `true`; otherwise, `false`.
 */
export const reuploadDuplicateCheck = async (
  oldImagePath: TypeImagePath | null,
  newImagePath: TypeImagePath,
): Promise<boolean> => {
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
      requestContext.translate("invalid.fileType"),
    );
  }
};
