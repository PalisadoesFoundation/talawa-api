import { deleteImage } from "./deleteImage";
import { errors, requestContext } from "../libraries";
import { INVALID_FILE_TYPE } from "../constants";
/**
 * This function checks the extension of the file.
 * If the extension isn't of type 'png', or 'jpg', or 'jpeg',
 * then the file is deleted and a validation error is thrown.
 * @param filename - Name of file
 */
export const imageExtensionCheck = async (filename: string): Promise<void> => {
  const fileExtension = filename.split(".").pop();

  if (
    fileExtension !== "png" &&
    fileExtension !== "jpg" &&
    fileExtension !== "jpeg"
  ) {
    await deleteImage(filename);

    throw new errors.ValidationError(
      [
        {
          message: requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
          code: INVALID_FILE_TYPE.CODE,
          param: INVALID_FILE_TYPE.PARAM,
        },
      ],
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE)
    );
  }
};
