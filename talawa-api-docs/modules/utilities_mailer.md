[talawa-api](../README.md) / [Exports](../modules.md) / utilities/mailer

# Module: utilities/mailer

## Table of contents

### Interfaces

- [InterfaceMailFields](../interfaces/utilities_mailer.InterfaceMailFields.md)

### Functions

- [mailer](utilities_mailer.md#mailer)

## Functions

### mailer

▸ **mailer**(`mailFields`): `Promise`\<`string` \| `SentMessageInfo`\>

This function sends emails to the specified user using the node mailer module.

#### Parameters

| Name | Type |
| :------ | :------ |
| `mailFields` | [`InterfaceMailFields`](../interfaces/utilities_mailer.InterfaceMailFields.md) |

#### Returns

`Promise`\<`string` \| `SentMessageInfo`\>

Promise along with resolve and reject methods.

**`Remarks`**

This is a utility method.

#### Defined in

[src/utilities/mailer.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/utilities/mailer.ts#L24)
