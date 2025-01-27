[**talawa-api**](../../../README.md)

***

# Function: imageAlreadyInDbCheck()

> **imageAlreadyInDbCheck**(`oldImagePath`, `newImagePath`): `Promise`\<`string`\>

Checks if an image already exists in the database using its hash value.
If the image exists, it points to the existing image and removes the newly uploaded image.
If the image does not exist, it saves the image hash in the database.

## Parameters

### oldImagePath

`string`

Path of the old image that might be replaced.

### newImagePath

`string`

Path of the newly uploaded image.

## Returns

`Promise`\<`string`\>

The file name of the existing image if found; otherwise, undefined.

## Defined in

[src/utilities/imageAlreadyInDbCheck.ts:16](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/utilities/imageAlreadyInDbCheck.ts#L16)
