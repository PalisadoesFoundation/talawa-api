[talawa-api](../README.md) / [Exports](../modules.md) / utilities/graphqlConnectionFactory

# Module: utilities/graphqlConnectionFactory

## Table of contents

### Functions

- [generateConnectionObject](utilities_graphqlConnectionFactory.md#generateconnectionobject)
- [getFilterObject](utilities_graphqlConnectionFactory.md#getfilterobject)
- [getLimit](utilities_graphqlConnectionFactory.md#getlimit)
- [getSortingObject](utilities_graphqlConnectionFactory.md#getsortingobject)
- [graphqlConnectionFactory](utilities_graphqlConnectionFactory.md#graphqlconnectionfactory)

## Functions

### generateConnectionObject

▸ **generateConnectionObject**\<`T1`, `T2`\>(`args`, `allFetchedObjects`, `getNodeFromResult`): `InterfaceConnectionResult`\<`T1`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T1` | extends `Object` |
| `T2` | extends `Object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`CursorPaginationInput`](types_generatedGraphQLTypes.md#cursorpaginationinput) |
| `allFetchedObjects` | ``null`` \| `T2`[] |
| `getNodeFromResult` | `GetNodeFromResultFnType`\<`T1`, `T2`\> |

#### Returns

`InterfaceConnectionResult`\<`T1`\>

#### Defined in

[src/utilities/graphqlConnectionFactory.ts:106](https://github.com/PalisadoesFoundation/talawa-api/blob/1bb35e9/src/utilities/graphqlConnectionFactory.ts#L106)

___

### getFilterObject

▸ **getFilterObject**(`args`): `FilterObjectType` \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`CursorPaginationInput`](types_generatedGraphQLTypes.md#cursorpaginationinput) |

#### Returns

`FilterObjectType` \| ``null``

#### Defined in

[src/utilities/graphqlConnectionFactory.ts:75](https://github.com/PalisadoesFoundation/talawa-api/blob/1bb35e9/src/utilities/graphqlConnectionFactory.ts#L75)

___

### getLimit

▸ **getLimit**(`limit`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `limit` | `number` |

#### Returns

`number`

#### Defined in

[src/utilities/graphqlConnectionFactory.ts:46](https://github.com/PalisadoesFoundation/talawa-api/blob/1bb35e9/src/utilities/graphqlConnectionFactory.ts#L46)

___

### getSortingObject

▸ **getSortingObject**(`direction`, `sortingObject`): `Record`\<`string`, `number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `direction` | ``"BACKWARD"`` \| ``"FORWARD"`` |
| `sortingObject` | `Record`\<`string`, `number`\> |

#### Returns

`Record`\<`string`, `number`\>

#### Defined in

[src/utilities/graphqlConnectionFactory.ts:53](https://github.com/PalisadoesFoundation/talawa-api/blob/1bb35e9/src/utilities/graphqlConnectionFactory.ts#L53)

___

### graphqlConnectionFactory

▸ **graphqlConnectionFactory**\<`T`\>(): `InterfaceConnection`\<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Returns

`InterfaceConnection`\<`T`\>

#### Defined in

[src/utilities/graphqlConnectionFactory.ts:34](https://github.com/PalisadoesFoundation/talawa-api/blob/1bb35e9/src/utilities/graphqlConnectionFactory.ts#L34)
