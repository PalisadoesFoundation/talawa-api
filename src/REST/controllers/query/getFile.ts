import type { Request, Response } from "express";
import { s3Client, BUCKET_NAME } from "../../../config/minio";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

/**
 * Middleware to retrieve a file from S3 storage.
 *
 * This function retrieves a file from an S3-compatible storage service using the provided key from the request parameters.
 * If the file is found, it streams the file's content back to the client with the appropriate content type.
 * If an error occurs during the retrieval, it logs the error and sends a 500 status code response.
 *
 * @param req - The Express request object, containing the key for the file in the parameters.
 * @param res - The Express response object used to send the file back to the client.
 *
 * @returns A promise that resolves to void. The function either streams the file or sends an error response.
 *
 * @example
 * ```typescript
 * app.get("/file/:key*", getFile);
 * ```
 */
export const getFile = async (req: Request, res: Response): Promise<void> => {
  const key = req.params[0];
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const data = await s3Client.send(command);
    const stream = data.Body as Readable;
    res.setHeader("Content-Type", data.ContentType as string);
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    stream.pipe(res);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).send("Error occurred while fetching file");
  }
};
