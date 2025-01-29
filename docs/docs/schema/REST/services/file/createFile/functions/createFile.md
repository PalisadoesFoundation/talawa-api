[**talawa-api**](../../../../../README.md)

***

# Function: createFile()

> **createFile**(`uploadResult`, `originalname`, `mimetype`, `size`): `Promise`\<[`InterfaceFile`](../../../../../models/File/interfaces/InterfaceFile.md)\>

Creates or updates a file document in the database based on the upload result.

This function checks if a file with the same hash already exists. If it does, the reference count of the file is incremented.
If not, a new file document is created and saved to the database.

## Parameters

### uploadResult

[`InterfaceUploadResult`](../../../minio/interfaces/InterfaceUploadResult.md)

The result from the file upload containing the hash, object key, and hash algorithm.

### originalname

`string`

The original name of the uploaded file.

### mimetype

`string`

The MIME type of the uploaded file.

### size

`number`

The size of the uploaded file in bytes.

## Returns

`Promise`\<[`InterfaceFile`](../../../../../models/File/interfaces/InterfaceFile.md)\>

A promise that resolves to the created or updated file document.

## Example

```typescript
const file = await createFile(uploadResult, "image.png", "image/png", 2048);
console.log(file);
```

## Defined in

[src/REST/services/file/createFile.ts:25](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/REST/services/file/createFile.ts#L25)
