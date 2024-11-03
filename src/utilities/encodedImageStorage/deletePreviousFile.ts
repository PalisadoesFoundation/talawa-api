import { File } from "../../models";
import { deleteFile } from "../../REST/services/minio";
import { BUCKET_NAME } from "../../config/minio";

/**
 * Deletes a file from the storage and database if its reference count is 1.
 * Otherwise, decrements the reference count in the database by 1.
 *
 * @param fileId - The ID of the file to be deleted or updated.
 * @param objectKey - The object key in the storage bucket associated with the file.
 * @returns A promise that resolves when the file is either deleted or its reference count is updated.
 */
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
