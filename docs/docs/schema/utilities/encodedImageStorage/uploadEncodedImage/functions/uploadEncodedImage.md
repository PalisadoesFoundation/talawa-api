[Admin Docs](/)

***

# Function: uploadEncodedImage()

> **uploadEncodedImage**(`encodedImageURL`, `previousImagePath`?): `Promise`\<`string`\>

Uploads an encoded image to the server.

## Parameters

### encodedImageURL

`string`

The URL or content of the encoded image to upload.

### previousImagePath?

`string`

Optional. The path of the previous image to delete before uploading the new one.

## Returns

`Promise`\<`string`\>

The file name of the uploaded image.

## Defined in

[src/utilities/encodedImageStorage/uploadEncodedImage.ts:46](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/encodedImageStorage/uploadEncodedImage.ts#L46)
