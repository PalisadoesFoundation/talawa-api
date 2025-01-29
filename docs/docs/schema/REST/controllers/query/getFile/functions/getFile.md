[**talawa-api**](../../../../../README.md)

***

# Function: getFile()

> **getFile**(`req`, `res`): `Promise`\<`void`\>

Middleware to retrieve a file from S3 storage.

This function retrieves a file from an S3-compatible storage service using the provided key from the request parameters.
If the file is found, it streams the file's content back to the client with the appropriate content type.
If an error occurs during the retrieval, it logs the error and sends a 500 status code response.

## Parameters

### req

`Request`

The Express request object, containing the key for the file in the parameters.

### res

`Response`

The Express response object used to send the file back to the client.

## Returns

`Promise`\<`void`\>

A promise that resolves to void. The function either streams the file or sends an error response.

## Example

```typescript
app.get("/file/:key*", getFile);
```

## Defined in

[src/REST/controllers/query/getFile.ts:23](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/REST/controllers/query/getFile.ts#L23)
