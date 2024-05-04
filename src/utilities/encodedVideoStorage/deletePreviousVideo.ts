import { unlink } from "fs/promises";
import path from "path";
import { EncodedVideo } from "../../models/EncodedVideo";

export const deletePreviousVideo = async (
  videoToBeDeletedPath: string,
): Promise<void> => {
  const videoToBeDeleted = await EncodedVideo.findOne({
    fileName: videoToBeDeletedPath,
  });

  if (videoToBeDeleted?.numberOfUses === 1) {
    await unlink(path.join(__dirname, "../../../" + videoToBeDeleted.fileName));
    await EncodedVideo.deleteOne({
      fileName: videoToBeDeletedPath,
    });
  }

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
