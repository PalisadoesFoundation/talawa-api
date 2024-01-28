[talawa-api](../README.md) / [Exports](../modules.md) / utilities/imageExtensionCheck

# Module: utilities/imageExtensionCheck

## Table of contents

### Functions

- [imageExtensionCheck](utilities_imageExtensionCheck.md#imageextensioncheck)

## Functions

### imageExtensionCheck

▸ **imageExtensionCheck**(`filename`): `Promise`\<`void`\>

This function checks the extension of the file.
If the extension isn't of type 'png', or 'jpg', or 'jpeg',
then the file is deleted and a validation error is thrown.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `filename` | `string` | Name of file |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/utilities/imageExtensionCheck.ts:10](https://github.com/PalisadoesFoundation/talawa-api/blob/de4debc/src/utilities/imageExtensionCheck.ts#L10)
