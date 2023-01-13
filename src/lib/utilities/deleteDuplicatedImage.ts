import { unlink, PathLike } from "fs";
import { logger } from "../libraries";

export const deleteDuplicatedImage = (imagePath: PathLike) => {
  unlink(imagePath, function (error) {
    if (error) {
      throw new Error(error);
    }

    // if no error is thrown, file has been deleted successfully
    logger.info("File was deleted as it already exists in the db!");
  });
};
