import { File } from "../../models";
import { deleteFile } from "../../REST/services/minio";
import { BUCKET_NAME } from "../../config/minio";

export const deletePreviousFile = async (
  fileId: string,
  objectKey: string,
): Promise<void> => {
  const file = await File.findOne({
    _id: fileId,
  });

  if (file?.referenceCount === 1) {
    await deleteFile(BUCKET_NAME as string, objectKey);
    await File.deleteOne({
      _id: fileId,
    });
  } else {
    await File.findOneAndUpdate(
      {
        _id: fileId,
      },
      {
        $inc: {
          referenceCount: -1,
        },
      },
    );
  }
};
