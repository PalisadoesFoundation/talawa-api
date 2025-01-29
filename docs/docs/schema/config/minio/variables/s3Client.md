[Admin Docs](/)

***

# Variable: s3Client

> `const` **s3Client**: `S3Client`

Initializes and exports an S3 client instance using AWS SDK for connecting to MinIO storage.

The `s3Client` is an instance of the AWS S3 client configured to interact with a MinIO storage service.
The client uses custom endpoint, credentials, and region details from environment variables to
establish the connection. It also forces path-style access to ensure compatibility with MinIO.

**Environment Variables:**
- `MINIO_ENDPOINT`: The MinIO storage endpoint URL.
- `MINIO_ROOT_USER`: The access key ID for the MinIO instance.
- `MINIO_ROOT_PASSWORD`: The secret access key for the MinIO instance.
- `MINIO_BUCKET`: The default bucket name in MinIO.

## Example

```typescript
import { s3Client } from './path/to/file';

// Example usage
const data = await s3Client.send(new ListBucketsCommand({}));
console.log(data.Buckets);
```

## Returns

S3Client - an instance of the AWS S3 client configured for MinIO storage.

## Defined in

[src/config/minio/index.ts:27](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/config/minio/index.ts#L27)
