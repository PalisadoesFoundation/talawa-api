import { unlink } from "fs";
import logger from "../libraries/logger";
import { ImageHash } from "../models";
import { reuploadDuplicateCheck } from "./reuploadDuplicateCheck";

export const deleteImage = async (
  imageToBeDeleted: string,
  imageBelongingToItem?: string
) => {
  let imageIsDuplicate = false;

  if (imageBelongingToItem) {
    imageIsDuplicate = await reuploadDuplicateCheck(
      imageToBeDeleted,
      imageBelongingToItem
    );
  }

  if (imageIsDuplicate === false) {
    /* 
    Only remove the old image if its different from the new one
    Ensure image hash isn't used by multiple users/organization before deleting it
    */
    const imageHash = await ImageHash.findOne({
      fileName: imageToBeDeleted,
    }).lean();

    if (imageHash && imageHash.numberOfUses > 1) {
      // Image can only be deleted if imageHash.numberOfUses === 1
      logger.info("Image cannot be deleted");
    } else {
      logger.info("Image is only used once and therefore can be deleted");

      unlink(imageToBeDeleted, (error) => {
        if (error) {
          throw error;
        }

        // If no error occurs image has been successfully deleted.
        logger.info("File deleted!");
      });
    }

    await ImageHash.updateOne(
      {
        fileName: imageToBeDeleted,
      },
      {
        $inc: {
          numberOfUses: -1,
        },
      }
    );
  }
};
