[Admin Docs](/)

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

[src/utilities/encodedImageStorage/deletePreviousImage.ts:10](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/encodedImageStorage/deletePreviousImage.ts#L10)
