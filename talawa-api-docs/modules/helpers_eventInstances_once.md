[talawa-api](../README.md) / [Exports](../modules.md) / helpers/eventInstances/once

# Module: helpers/eventInstances/once

## Table of contents

### Functions

- [generateEvent](helpers_eventInstances_once.md#generateevent)

## Functions

### generateEvent

▸ **generateEvent**(`args`, `currentUser`, `organization`, `session`): `Promise`\<`Promise`\<[`InterfaceEvent`](../interfaces/models_Event.InterfaceEvent.md)[]\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Partial`\<[`MutationCreateEventArgs`](types_generatedGraphQLTypes.md#mutationcreateeventargs)\> |
| `currentUser` | [`InterfaceUser`](../interfaces/models_User.InterfaceUser.md) |
| `organization` | [`InterfaceOrganization`](../interfaces/models_Organization.InterfaceOrganization.md) |
| `session` | `ClientSession` |

#### Returns

`Promise`\<`Promise`\<[`InterfaceEvent`](../interfaces/models_Event.InterfaceEvent.md)[]\>\>

#### Defined in

[src/helpers/eventInstances/once.ts:10](https://github.com/PalisadoesFoundation/talawa-api/blob/6295a23/src/helpers/eventInstances/once.ts#L10)
