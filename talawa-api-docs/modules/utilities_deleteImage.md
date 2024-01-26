[talawa-api](../README.md) / [Exports](../modules.md) / utilities/deleteImage

# Module: utilities/deleteImage

## Table of contents

### Functions

- [deleteImage](utilities_deleteImage.md#deleteimage)

## Functions

### deleteImage

▸ **deleteImage**(`imageToBeDeleted`, `imageBelongingToItem?`): `Promise`\<`void`\>

This function deletes an image if it is only used once.
It is also ensured that the image hash isn't used by multiple users/organization before deleting it
After deleting the image, the number of uses of the hashed image are decremented by one.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `imageToBeDeleted` | `string` | Path of image |
| `imageBelongingToItem?` | `string` | Does image belong to an item |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/utilities/deleteImage.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/3a8a11a/src/utilities/deleteImage.ts#L12)
