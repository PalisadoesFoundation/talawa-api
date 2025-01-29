[Admin Docs](/)

***

# Function: uploadFile()

> **uploadFile**(`req`, `res`): `Promise`\<[`InterfaceUploadedFileResponse`](../interfaces/InterfaceUploadedFileResponse.md)\>

Handles file upload.

## Parameters

### req

`Request`

The HTTP request object containing the file.

### res

`Response`

The HTTP response object used to send the response.

## Returns

`Promise`\<[`InterfaceUploadedFileResponse`](../interfaces/InterfaceUploadedFileResponse.md)\>

UploadedFileResponse - The response containing file ID and object key.

## Throws

Error - Throws an error if no file is uploaded or if the file type is invalid.

## Defined in

[src/REST/services/file/uploadFile.ts:28](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/REST/services/file/uploadFile.ts#L28)
