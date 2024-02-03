[talawa-api](../README.md) / [Exports](../modules.md) / utilities/userFamilyAdminCheck

# Module: utilities/userFamilyAdminCheck

## Table of contents

### Functions

- [adminCheck](utilities_userFamilyAdminCheck.md#admincheck)

## Functions

### adminCheck

▸ **adminCheck**(`userId`, `userFamily`): `Promise`\<`void`\>

If the current user is an admin of the organisation, this function returns `true` otherwise it returns `false`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userId` | `string` \| `ObjectId` | Current user id. |
| `userFamily` | [`InterfaceUserFamily`](../interfaces/models_userFamily.InterfaceUserFamily.md) | userFamily data of `InterfaceuserFamily` type. |

#### Returns

`Promise`\<`void`\>

`True` or `False`.

**`Remarks`**

This is a utility method.

#### Defined in

[src/utilities/userFamilyAdminCheck.ts:14](https://github.com/PalisadoesFoundation/talawa-api/blob/b1dd6c9/src/utilities/userFamilyAdminCheck.ts#L14)
