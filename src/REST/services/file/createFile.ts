import { BUCKET_NAME } from "../../../config/minio";
import { BASE_URL } from "../../../constants";
import type { InterfaceFile } from "../../../models";
import { File } from "../../../models";
import type { InterfaceUploadResult } from "../minio";

/**
 * Creates or updates a file document in the database based on the upload result.
 *
 * This function checks if a file with the same hash already exists. If it does, the reference count of the file is incremented.
 * If not, a new file document is created and saved to the database.
 *
 * @param uploadResult - The result from the file upload containing the hash, object key, and hash algorithm.
 * @param originalname - The original name of the uploaded file.
 * @param mimetype - The MIME type of the uploaded file.
 * @param size - The size of the uploaded file in bytes.
 * @returns A promise that resolves to the created or updated file document.
 *
 * @example
 * ```typescript
 * const file = await createFile(uploadResult, "image.png", "image/png", 2048);
 * console.log(file);
 * ```
 */
export const createFile = async (
  uploadResult: InterfaceUploadResult,
  originalname: string,
  mimetype: string,
  size: number,
): Promise<InterfaceFile> => {
  const existingFile = await File.findOne({ "hash.value": uploadResult.hash });

  if (existingFile) {
    existingFile.referenceCount += 1;
    await existingFile.save();
    return existingFile;
  }

  const newFileDoc = await File.create({
    fileName: originalname,
    mimeType: mimetype,
    size: size,
    hash: {
      value: uploadResult.hash,
      algorithm: uploadResult.hashAlgorithm,
    },
    uri: `${BASE_URL}api/file/${uploadResult.objectKey}`,
    metadata: {
      objectKey: uploadResult.objectKey,
      bucketName: BUCKET_NAME,
    },
  });

  return newFileDoc;
};
