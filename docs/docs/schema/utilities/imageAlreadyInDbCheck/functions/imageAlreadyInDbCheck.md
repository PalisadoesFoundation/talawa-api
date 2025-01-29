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

[src/utilities/imageAlreadyInDbCheck.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/imageAlreadyInDbCheck.ts#L16)
