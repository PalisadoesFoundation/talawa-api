import { unlink } from "fs";
import { logger } from "../libraries";
import { ImageHash } from "../models";
import { reuploadDuplicateCheck } from "./reuploadDuplicateCheck";

/**
 * Deletes an image file if it meets deletion criteria based on usage and duplicate checks.
 *
 * @param imageToBeDeleted - The path of the image file to be deleted
 * @param imageBelongingToItem - Optional. Indicates if the image belongs to a specific item for duplicate check
 * @returns A promise that resolves once the image is successfully deleted
 */
export const deleteImage = async (
  imageToBeDeleted: string,
  imageBelongingToItem?: string,
): Promise<void> => {
  let imageIsDuplicate = false;

  if (imageBelongingToItem) {
    // Check if the image is a duplicate of another image belonging to the same item
    imageIsDuplicate = await reuploadDuplicateCheck(
      imageToBeDeleted,
      imageBelongingToItem,
    );
  }

  if (!imageIsDuplicate) {
    // Proceed with deletion only if the image is not a duplicate

    // Retrieve the image hash information from the database
    const imageHash = await ImageHash.findOne({
      fileName: imageToBeDeleted,
    }).lean();

    if (imageHash && imageHash?.numberOfUses > 1) {
      // If the image is used by multiple users/organizations, log that it cannot be deleted
      logger.info("Image cannot be deleted");
    } else {
      // If the image is only used once or not tracked by image hash, proceed with deletion
      logger.info("Image is only used once and therefore can be deleted");

      // Delete the image file from the filesystem
      unlink(imageToBeDeleted, (error) => {
        if (error) {
          throw error;
        }

        // If no error occurs image has been successfully deleted.
        logger.info("File deleted!");
      });
    }

    // Decrease the usage count of the image hash in the database
    await ImageHash.updateOne(
      {
        fileName: imageToBeDeleted,
      },
      {
        $inc: {
          numberOfUses: -1,
        },
      },
    );
  }
};
