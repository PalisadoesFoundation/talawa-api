[Admin Docs](/)

***

# Function: deleteImage()

> **deleteImage**(`imageToBeDeleted`, `imageBelongingToItem`?): `Promise`\<`void`\>

Deletes an image file if it meets deletion criteria based on usage and duplicate checks.

## Parameters

### imageToBeDeleted

`string`

The path of the image file to be deleted

### imageBelongingToItem?

`string`

Optional. Indicates if the image belongs to a specific item for duplicate check

## Returns

`Promise`\<`void`\>

A promise that resolves once the image is successfully deleted

## Defined in

[src/utilities/deleteImage.ts:13](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/utilities/deleteImage.ts#L13)
