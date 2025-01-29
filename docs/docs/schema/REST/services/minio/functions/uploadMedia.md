[**talawa-api**](../../../../README.md)

***

# Function: uploadMedia()

> **uploadMedia**(`bucketName`, `buffer`, `originalname`, `contentType`): `Promise`\<[`InterfaceUploadResult`](../interfaces/InterfaceUploadResult.md)\>

Uploads a media file to a specified S3 bucket, calculating its hash for naming and uniqueness.

The `uploadMedia` function calculates the SHA-256 hash of the provided buffer to generate a unique object key.
It first checks if a file with the same hash already exists in the bucket using the `HeadObjectCommand`.
If the file does not exist, it uploads the file using the `PutObjectCommand`. It supports both image and video uploads
by assigning appropriate prefixes to the object key.

## Parameters

### bucketName

`string`

The name of the S3 bucket where the file will be uploaded.

### buffer

`Buffer`

The file content as a buffer.

### originalname

`string`

The original file name, used to determine the file extension.

### contentType

An object specifying the content type of the file.

#### ContentType

`string`

## Returns

`Promise`\<[`InterfaceUploadResult`](../interfaces/InterfaceUploadResult.md)\>

A promise that resolves to an object containing the file's existence status, object key, hash, and hash algorithm.

## Example

```typescript
const result = await uploadMedia("my-bucket", fileBuffer, "image.png", { ContentType: "image/png" });
console.log(result);
```

## Defined in

[src/REST/services/minio/index.ts:43](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/REST/services/minio/index.ts#L43)
