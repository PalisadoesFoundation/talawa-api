import { S3Client } from "@aws-sdk/client-s3";

/**
 * Initializes and exports an S3 client instance using AWS SDK for connecting to MinIO storage.
 *
 * The `s3Client` is an instance of the AWS S3 client configured to interact with a MinIO storage service.
 * The client uses custom endpoint, credentials, and region details from environment variables to
 * establish the connection. It also forces path-style access to ensure compatibility with MinIO.
 *
 * **Environment Variables:**
 * - `MINIO_ENDPOINT`: The MinIO storage endpoint URL.
 * - `MINIO_ROOT_USER`: The access key ID for the MinIO instance.
 * - `MINIO_ROOT_PASSWORD`: The secret access key for the MinIO instance.
 * - `MINIO_BUCKET`: The default bucket name in MinIO.
 *
 * @example
 * ```typescript
 * import { s3Client } from './path/to/file';
 *
 * // Example usage
 * const data = await s3Client.send(new ListBucketsCommand({}));
 * console.log(data.Buckets);
 * ```
 *
 * @returns S3Client - an instance of the AWS S3 client configured for MinIO storage.
 */
export const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER as string,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD as string,
  },
  region: process.env.MNIO_REGION,
  forcePathStyle: true,
});

/**
 * The name of the bucket used in the MinIO storage, defined via an environment variable.
 *
 * @example
 * ```typescript
 * console.log(BUCKET_NAME); // Logs the bucket name from the environment
 * ```
 *
 * @returns The name of the MinIO bucket.
 */
export const BUCKET_NAME = process.env.MINIO_BUCKET;
