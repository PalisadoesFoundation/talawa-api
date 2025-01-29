[**talawa-api**](../../../../README.md)

***

# Function: deletePreviousImage()

> **deletePreviousImage**(`imageToBeDeletedPath`): `Promise`\<`void`\>

Deletes the previous image file if its `numberOfUses` is 1 and updates the `numberOfUses` in the database.

## Parameters

### imageToBeDeletedPath

`string`

Path of the image to be deleted.

## Returns

`Promise`\<`void`\>

## Defined in

[src/utilities/encodedImageStorage/deletePreviousImage.ts:10](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/utilities/encodedImageStorage/deletePreviousImage.ts#L10)
