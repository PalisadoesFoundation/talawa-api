import { unlink } from "fs/promises";
import path from "path";
import { EncodedImage } from "../../models/EncodedImage";

/**
 * Deletes the previous image file if its `numberOfUses` is 1 and updates the `numberOfUses` in the database.
 * @param imageToBeDeletedPath - Path of the image to be deleted.
 */
export const deletePreviousImage = async (
  imageToBeDeletedPath: string,
): Promise<void> => {
  // Find the EncodedImage document with the given fileName
  const imageToBeDeleted = await EncodedImage.findOne({
    fileName: imageToBeDeletedPath ?? "",
  });

  // Check if the image exists and its numberOfUses is 1
  if (imageToBeDeleted?.numberOfUses === 1) {
    // Delete the image file from the file system
    await unlink(path.join(__dirname, "../../../" + imageToBeDeleted.fileName));

    // Delete the EncodedImage document from the database
    await EncodedImage.deleteOne({
      fileName: imageToBeDeletedPath,
    });
  }

  await EncodedImage.findOneAndUpdate(
    {
      fileName: imageToBeDeletedPath,
    },
    {
      $inc: {
        numberOfUses: -1,
      },
    },
  );
};
