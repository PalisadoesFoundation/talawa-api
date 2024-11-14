import type { PathLike } from "fs";
import { unlink } from "fs";
import { logger } from "../libraries";

/**
 * Deletes a duplicated image file using fs.unlink().
 * @param imagePath - The path to the image file to delete.
 * @throws Throws an error if deletion fails.
 */
export const deleteDuplicatedImage = (imagePath: PathLike): void => {
  // Attempt to delete the image file
  unlink(imagePath, function (error) {
    if (error) {
      // Throw an error if deletion fails
      throw error;
    }

    // Log a success message if deletion succeeds
    logger.info("File was deleted as it already exists in the db!");
  });
};
