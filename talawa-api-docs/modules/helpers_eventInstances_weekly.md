[talawa-api](../README.md) / [Exports](../modules.md) / helpers/eventInstances/weekly

# Module: helpers/eventInstances/weekly

## Table of contents

### Functions

- [generateEvents](helpers_eventInstances_weekly.md#generateevents)

## Functions

### generateEvents

▸ **generateEvents**(`args`, `currentUser`, `organization`, `session`): `Promise`\<[`InterfaceEvent`](../interfaces/models_Event.InterfaceEvent.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Partial`\<[`MutationCreateEventArgs`](types_generatedGraphQLTypes.md#mutationcreateeventargs)\> |
| `currentUser` | [`InterfaceUser`](../interfaces/models_User.InterfaceUser.md) |
| `organization` | [`InterfaceOrganization`](../interfaces/models_Organization.InterfaceOrganization.md) |
| `session` | `ClientSession` |

#### Returns

`Promise`\<[`InterfaceEvent`](../interfaces/models_Event.InterfaceEvent.md)[]\>

#### Defined in

[src/helpers/eventInstances/weekly.ts:18](https://github.com/PalisadoesFoundation/talawa-api/blob/ac416c4/src/helpers/eventInstances/weekly.ts#L18)
