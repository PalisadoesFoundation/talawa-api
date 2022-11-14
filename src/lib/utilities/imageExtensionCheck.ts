import { deleteImage } from "./deleteImage";
import { errors, requestContext } from "../libraries";
/**
 * This function checks the extension of the file.
 * If the extension isn't of type 'png', or 'jpg', or 'jpeg',
 * then the file is deleted and a validation error is thrown.
 * @param filename - Name of file
 */
export const imageExtensionCheck = async (filename: string) => {
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
          message: requestContext.translate("invalid.fileType"),
          code: "invalid.fileType",
          param: "fileType",
        },
      ],
      requestContext.translate("invalid.fileType")
    );
  }
};
