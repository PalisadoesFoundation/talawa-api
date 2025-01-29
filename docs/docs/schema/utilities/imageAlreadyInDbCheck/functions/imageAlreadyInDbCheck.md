[Admin Docs](/)

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

[src/utilities/imageAlreadyInDbCheck.ts:16](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/imageAlreadyInDbCheck.ts#L16)
