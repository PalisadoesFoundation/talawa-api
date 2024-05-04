import { unlink } from "fs/promises";
import path from "path";
import { EncodedImage } from "../../models/EncodedImage";

export const deletePreviousImage = async (
  imageToBeDeletedPath: string,
): Promise<void> => {
  const imageToBeDeleted = await EncodedImage.findOne({
    fileName: imageToBeDeletedPath ?? "",
  });

  if (imageToBeDeleted?.numberOfUses === 1) {
    await unlink(path.join(__dirname, "../../../" + imageToBeDeleted.fileName));
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
