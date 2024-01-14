[talawa-api](../README.md) / [Exports](../modules.md) / utilities/createSampleOrganizationUtil

# Module: utilities/createSampleOrganizationUtil

## Table of contents

### Functions

- [createSampleOrganization](utilities_createSampleOrganizationUtil.md#createsampleorganization)
- [generateEventData](utilities_createSampleOrganizationUtil.md#generateeventdata)
- [generatePostData](utilities_createSampleOrganizationUtil.md#generatepostdata)
- [generateRandomPlugins](utilities_createSampleOrganizationUtil.md#generaterandomplugins)
- [generateUserData](utilities_createSampleOrganizationUtil.md#generateuserdata)

## Functions

### createSampleOrganization

▸ **createSampleOrganization**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/utilities/createSampleOrganizationUtil.ts:213](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/utilities/createSampleOrganizationUtil.ts#L213)

___

### generateEventData

▸ **generateEventData**(`users`, `organizationId`): `Promise`\<[`InterfaceEvent`](../interfaces/models_Event.InterfaceEvent.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `users` | [`InterfaceUser`](../interfaces/models_User.InterfaceUser.md)[] |
| `organizationId` | `string` |

#### Returns

`Promise`\<[`InterfaceEvent`](../interfaces/models_Event.InterfaceEvent.md)\>

#### Defined in

[src/utilities/createSampleOrganizationUtil.ts:62](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/utilities/createSampleOrganizationUtil.ts#L62)

___

### generatePostData

▸ **generatePostData**(`users`, `organizationId`): `Promise`\<[`InterfacePost`](../interfaces/models_Post.InterfacePost.md) & `Document`\<`any`, `any`, [`InterfacePost`](../interfaces/models_Post.InterfacePost.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `users` | [`InterfaceUser`](../interfaces/models_User.InterfaceUser.md)[] |
| `organizationId` | `string` |

#### Returns

`Promise`\<[`InterfacePost`](../interfaces/models_Post.InterfacePost.md) & `Document`\<`any`, `any`, [`InterfacePost`](../interfaces/models_Post.InterfacePost.md)\>\>

#### Defined in

[src/utilities/createSampleOrganizationUtil.ts:126](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/utilities/createSampleOrganizationUtil.ts#L126)

___

### generateRandomPlugins

▸ **generateRandomPlugins**(`numberOfPlugins`, `users`): `Promise`\<`Promise`\<`any`\>[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `numberOfPlugins` | `number` |
| `users` | `string`[] |

#### Returns

`Promise`\<`Promise`\<`any`\>[]\>

#### Defined in

[src/utilities/createSampleOrganizationUtil.ts:183](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/utilities/createSampleOrganizationUtil.ts#L183)

___

### generateUserData

▸ **generateUserData**(`organizationId`, `userType`): `Promise`\<[`InterfaceUser`](../interfaces/models_User.InterfaceUser.md) & `Document`\<`any`, `any`, [`InterfaceUser`](../interfaces/models_User.InterfaceUser.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `organizationId` | `string` |
| `userType` | `string` |

#### Returns

`Promise`\<[`InterfaceUser`](../interfaces/models_User.InterfaceUser.md) & `Document`\<`any`, `any`, [`InterfaceUser`](../interfaces/models_User.InterfaceUser.md)\>\>

#### Defined in

[src/utilities/createSampleOrganizationUtil.ts:8](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/utilities/createSampleOrganizationUtil.ts#L8)
