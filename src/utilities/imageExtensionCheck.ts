import { deleteImage } from "./deleteImage";
import { errors, requestContext } from "../libraries";
import { INVALID_FILE_TYPE } from "../../src/constants";

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
          message: requestContext.translate(INVALID_FILE_TYPE.message),
          code: INVALID_FILE_TYPE.code,
          param: INVALID_FILE_TYPE.param,
        },
      ],
      requestContext.translate(INVALID_FILE_TYPE.message)
    );
  }
};
