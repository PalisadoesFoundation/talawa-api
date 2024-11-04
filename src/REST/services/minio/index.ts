// Import third-party modules
import crypto from "crypto";
import path from "path";

// Import AWS SDK S3 client and commands
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { DeleteObjectCommandOutput } from "@aws-sdk/client-s3";

// Import project configuration
import { s3Client } from "../../../config/minio";

export interface InterfaceUploadResult {
  exists: boolean;
  objectKey: string;
  hash: string;
  hashAlgorithm: string;
}

/**
 * Uploads a media file to a specified S3 bucket, calculating its hash for naming and uniqueness.
 *
 * The `uploadMedia` function calculates the SHA-256 hash of the provided buffer to generate a unique object key.
 * It first checks if a file with the same hash already exists in the bucket using the `HeadObjectCommand`.
 * If the file does not exist, it uploads the file using the `PutObjectCommand`. It supports both image and video uploads
 * by assigning appropriate prefixes to the object key.
 *
 * @param bucketName - The name of the S3 bucket where the file will be uploaded.
 * @param buffer - The file content as a buffer.
 * @param originalname - The original file name, used to determine the file extension.
 * @param contentType - An object specifying the content type of the file.
 * @returns A promise that resolves to an object containing the file's existence status, object key, hash, and hash algorithm.
 *
 * @example
 * ```typescript
 * const result = await uploadMedia("my-bucket", fileBuffer, "image.png", { ContentType: "image/png" });
 * console.log(result);
 * ```
 */
export const uploadMedia = async (
  bucketName: string,
  buffer: Buffer,
  originalname: string,
  contentType: { ContentType: string },
): Promise<InterfaceUploadResult> => {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const fileExtension = path.extname(originalname);

  let prefix = "";
  if (contentType.ContentType.startsWith("image/")) {
    prefix = "image/";
  } else if (contentType.ContentType.startsWith("video/")) {
    prefix = "video/";
  }

  const objectKey = `${prefix}${hash}${fileExtension}`;

  const headParams = {
    Bucket: bucketName,
    Key: objectKey,
  };
  const headCommand = new HeadObjectCommand(headParams);

  try {
    await s3Client.send(headCommand);
    return { exists: true, objectKey, hash, hashAlgorithm: "sha256" };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "name" in error &&
      error.name === "NotFound"
    ) {
      const params = {
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ...contentType,
      };

      try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        return { exists: false, objectKey, hash, hashAlgorithm: "sha256" };
      } catch (uploadError: unknown) {
        console.error("Error uploading the file:", uploadError);
        throw uploadError;
      }
    } else {
      console.error("Error checking file existence:", error);
      throw error;
    }
  }
};

/**
 * Deletes a file from a specified S3 bucket.
 *
 * The `deleteFile` function deletes an object in an S3 bucket using the `DeleteObjectCommand`.
 * If an error occurs during the deletion process, it logs the error and rethrows it.
 *
 * @param bucketName - The name of the S3 bucket from which the file will be deleted.
 * @param objectKey - The key of the object to be deleted in the S3 bucket.
 * @returns A promise that resolves to the output of the `DeleteObjectCommand`.
 *
 * @example
 * ```typescript
 * const response = await deleteFile("my-bucket", "image123.png");
 * console.log(response);
 * ```
 */
export const deleteFile = async (
  bucketName: string,
  objectKey: string,
): Promise<DeleteObjectCommandOutput> => {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };
  const command = new DeleteObjectCommand(params);
  try {
    const response = await s3Client.send(command);
    return response;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
