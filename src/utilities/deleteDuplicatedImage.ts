import type { PathLike } from "fs";
import { unlink } from "fs";
import { logger } from "../libraries";
/**
 * This function deletes a duplicated image using the function fs.unlink().
 * @param imagePath - Path of the image
 */
export const deleteDuplicatedImage = (imagePath: PathLike) => {
  unlink(imagePath, function (error) {
    if (error) {
      throw error;
    }

    // if no error is thrown, file has been deleted successfully
    logger.info("File was deleted as it already exists in the db!");
  });
};
