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

[src/utilities/encodedImageStorage/deletePreviousImage.ts:10](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/utilities/encodedImageStorage/deletePreviousImage.ts#L10)
