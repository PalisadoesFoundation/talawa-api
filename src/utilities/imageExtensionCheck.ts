import { deleteImage } from "./deleteImage";
import { errors, requestContext } from "../libraries";
import { INVALID_FILE_TYPE } from "../constants";

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
          message: requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
          code: INVALID_FILE_TYPE.CODE,
          param: INVALID_FILE_TYPE.PARAM,
        },
      ],
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE)
    );
  }
};
