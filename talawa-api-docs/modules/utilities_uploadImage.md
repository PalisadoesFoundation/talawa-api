[talawa-api](../README.md) / [Exports](../modules.md) / utilities/uploadImage

# Module: utilities/uploadImage

## Table of contents

### Functions

- [uploadImage](utilities_uploadImage.md#uploadimage)

## Functions

### uploadImage

▸ **uploadImage**(`newImageFile`, `oldImagePath`): `Promise`\<\{ `imageAlreadyInDbPath`: `string` ; `newImagePath`: `string`  }\>

This function uploads the new image and deletes the previously uploaded image if exists.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newImageFile` | `any` | File of a new Image with `any` type. |
| `oldImagePath` | ``null`` \| `string` | File of a current Image. It can be `null`. |

#### Returns

`Promise`\<\{ `imageAlreadyInDbPath`: `string` ; `newImagePath`: `string`  }\>

Path of an uploaded image.

**`Remarks`**

This is a utility method.

#### Defined in

[src/utilities/uploadImage.ts:16](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/utilities/uploadImage.ts#L16)
