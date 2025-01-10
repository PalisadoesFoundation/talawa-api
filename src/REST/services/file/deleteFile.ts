import { File } from "../../../models";
import { deleteFile as deleteFileFromBucket } from "../minio";
import { BUCKET_NAME } from "../../../config/minio";

export const deleteFile = async (
  objectKey: string,
  fileId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const file = await File.findOne({
      _id: fileId,
      "metadata.objectKey": objectKey,
    });

    if (!file) {
      return { success: false, message: "File not found." };
    }

    if (file.referenceCount > 1) {
      file.referenceCount -= 1;
      await file.save();
      return {
        success: true,
        message: "File reference count decreased successfully",
      };
    }

    await File.deleteOne({ _id: file.id });
    await deleteFileFromBucket(BUCKET_NAME as string, objectKey);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, message: "Error occurred while deleting file" };
  }
};
