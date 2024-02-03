[talawa-api](../README.md) / [Exports](../modules.md) / utilities/reuploadDuplicateCheck

# Module: utilities/reuploadDuplicateCheck

## Table of contents

### Type Aliases

- [TypeImagePath](utilities_reuploadDuplicateCheck.md#typeimagepath)

### Functions

- [reuploadDuplicateCheck](utilities_reuploadDuplicateCheck.md#reuploadduplicatecheck)

## Type Aliases

### TypeImagePath

Ƭ **TypeImagePath**: `string` \| `InterfaceUrlRequestObject` \| `InterfaceBufferObject`

#### Defined in

[src/utilities/reuploadDuplicateCheck.ts:15](https://github.com/PalisadoesFoundation/talawa-api/blob/4e2c75b/src/utilities/reuploadDuplicateCheck.ts#L15)

## Functions

### reuploadDuplicateCheck

▸ **reuploadDuplicateCheck**(`oldImagePath`, `newImagePath`): `Promise`\<`boolean`\>

This function determines whether a user or an organisation is
attempting to re-upload the same profile photo or organisation image.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `oldImagePath` | ``null`` \| [`TypeImagePath`](utilities_reuploadDuplicateCheck.md#typeimagepath) | Path of a current Org/User image of `type: TypeImagePath`. |
| `newImagePath` | [`TypeImagePath`](utilities_reuploadDuplicateCheck.md#typeimagepath) | Path of a new image of `type: TypeImagePath`. |

#### Returns

`Promise`\<`boolean`\>

If the identical image is trying to reuploaded, `true`; otherwise, `false`.

**`Remarks`**

This is a utility method.

#### Defined in

[src/utilities/reuploadDuplicateCheck.ts:42](https://github.com/PalisadoesFoundation/talawa-api/blob/4e2c75b/src/utilities/reuploadDuplicateCheck.ts#L42)
