[talawa-api](../README.md) / [Exports](../modules.md) / utilities/adminCheck

# Module: utilities/adminCheck

## Table of contents

### Functions

- [adminCheck](utilities_adminCheck.md#admincheck)

## Functions

### adminCheck

▸ **adminCheck**(`userId`, `organization`): `Promise`\<`void`\>

If the current user is an admin of the organisation, this function returns `true` otherwise it returns `false`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userId` | `string` \| `ObjectId` | Current user id. |
| `organization` | [`InterfaceOrganization`](../interfaces/models_Organization.InterfaceOrganization.md) | Organization data of `InterfaceOrganization` type. |

#### Returns

`Promise`\<`void`\>

`True` or `False`.

**`Remarks`**

This is a utility method.

#### Defined in

[src/utilities/adminCheck.ts:14](https://github.com/PalisadoesFoundation/talawa-api/blob/515781e/src/utilities/adminCheck.ts#L14)
