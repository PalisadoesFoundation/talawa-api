import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { ConnectionTimeoutError } from "redis";

/**
 * Creates an S3 client configured for testing with MinIO
 */
const createTestS3Client = (): S3Client => {
  return new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
    credentials: {
      accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
    },
    region: "us-east-1",
    forcePathStyle: true,
    requestHandler: {
      connectionTimeout: 3000,
      socketTimeout: 3000,
    },
  });
};

/**
 * Checks if the MinIO server is running and accessible
 */
export const isMinioRunning = async (): Promise<boolean> => {
  const s3Client = createTestS3Client();
  try {
    await s3Client.send(new ListBucketsCommand({}));
    return true;
  } catch (error: unknown) {
    if (
      (error instanceof ConnectionTimeoutError &&
        error.name === "ConnectTimeoutError") ||
      (error instanceof Error && error.name === "NetworkError") ||
      (error instanceof Error &&
        (error as { code?: string }).code === "ECONNREFUSED")
    ) {
      console.warn(
        "\x1b[33m%s\x1b[0m",
        "⚠️ MinIO server is not running. Some tests will be skipped.\n" +
          "To run all tests, start the MinIO server first.",
      );
      return false;
    }
    // If it's a different kind of error (e.g., authentication), we still consider the server as running
    return true;
  }
};
