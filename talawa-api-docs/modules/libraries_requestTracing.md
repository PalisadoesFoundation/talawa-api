[talawa-api](../README.md) / [Exports](../modules.md) / libraries/requestTracing

# Module: libraries/requestTracing

## Table of contents

### Variables

- [requestTracingNamespace](libraries_requestTracing.md#requesttracingnamespace)
- [tracingIdHeaderName](libraries_requestTracing.md#tracingidheadername)

### Functions

- [getTracingId](libraries_requestTracing.md#gettracingid)
- [middleware](libraries_requestTracing.md#middleware)
- [setTracingId](libraries_requestTracing.md#settracingid)
- [trace](libraries_requestTracing.md#trace)

## Variables

### requestTracingNamespace

• `Const` **requestTracingNamespace**: `Namespace`\<`Record`\<`string`, `any`\>\>

#### Defined in

[src/libraries/requestTracing.ts:17](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/libraries/requestTracing.ts#L17)

___

### tracingIdHeaderName

• `Const` **tracingIdHeaderName**: ``"X-Tracing-Id"``

#### Defined in

[src/libraries/requestTracing.ts:21](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/libraries/requestTracing.ts#L21)

## Functions

### getTracingId

▸ **getTracingId**(): `string`

#### Returns

`string`

#### Defined in

[src/libraries/requestTracing.ts:29](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/libraries/requestTracing.ts#L29)

___

### middleware

▸ **middleware**(): (`req`: `Request`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\>, `res`: `Response`\<`any`, `Record`\<`string`, `any`\>\>, `next`: `NextFunction`) => `void`

#### Returns

`fn`

▸ (`req`, `res`, `next`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\> |
| `res` | `Response`\<`any`, `Record`\<`string`, `any`\>\> |
| `next` | `NextFunction` |

##### Returns

`void`

#### Defined in

[src/libraries/requestTracing.ts:33](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/libraries/requestTracing.ts#L33)

___

### setTracingId

▸ **setTracingId**(`tracingId`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `tracingId` | `string` |

#### Returns

`string`

#### Defined in

[src/libraries/requestTracing.ts:25](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/libraries/requestTracing.ts#L25)

___

### trace

▸ **trace**\<`T`\>(`tracingId`, `method`): `Promise`\<`void`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `tracingId` | `string` |
| `method` | () => `T` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/libraries/requestTracing.ts:50](https://github.com/PalisadoesFoundation/talawa-api/blob/0763f35/src/libraries/requestTracing.ts#L50)
