import { deleteImage } from "./deleteImage";
import { errors, requestContext } from "../libraries";
import { INVALID_FILE_TYPE } from "../constants";

/**
 * Checks the file extension of the given filename.
 * If the extension is not 'png', 'jpg', or 'jpeg', deletes the file and throws a validation error.
 *
 * @param filename - The name of the file to check
 */
export const imageExtensionCheck = async (filename: string): Promise<void> => {
  const fileExtension = filename.split(".").pop();

  if (
    fileExtension !== "png" &&
    fileExtension !== "jpg" &&
    fileExtension !== "jpeg"
  ) {
    // Delete the file because the extension is not allowed
    await deleteImage(filename);

    // Throw a validation error indicating invalid file type
    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
          code: INVALID_FILE_TYPE.CODE,
          param: INVALID_FILE_TYPE.PARAM,
        },
      ],
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
    );
  }
};
