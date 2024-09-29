import { unlink } from "fs/promises";
import path from "path";
import { EncodedVideo } from "../../models/EncodedVideo";

/**
 * Deletes the previous video file and updates its database entry.
 *
 * @param videoToBeDeletedPath - The path of the video file to be deleted.
 * @returns A promise that resolves once the video file and database entry are deleted or updated.
 */
export const deletePreviousVideo = async (
  videoToBeDeletedPath: string,
): Promise<void> => {
  // Find the EncodedVideo document corresponding to the video file
  const videoToBeDeleted = await EncodedVideo.findOne({
    fileName: videoToBeDeletedPath,
  });

  // Check if the video file exists and has only one use left
  if (videoToBeDeleted?.numberOfUses === 1) {
    // Delete the video file from the file system
    await unlink(path.join(__dirname, "../../../" + videoToBeDeleted.fileName));

    // Delete the EncodedVideo document from the database
    await EncodedVideo.deleteOne({
      fileName: videoToBeDeletedPath,
    });
  }

  // Decrease the numberOfUses in the database for the video file
  await EncodedVideo.findOneAndUpdate(
    {
      fileName: videoToBeDeletedPath,
    },
    {
      $inc: {
        numberOfUses: -1,
      },
    },
  );
};
