[talawa-api](../README.md) / [Exports](../modules.md) / app

# Module: app

## Table of contents

### Functions

- [default](app.md#default)

## Functions

### default

▸ **default**(`req`, `res`): `any`

Express instance itself is a request handler, which could be invoked without
third argument.

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `IncomingMessage` \| `Request`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\> |
| `res` | `ServerResponse`\<`IncomingMessage`\> \| `Response`\<`any`, `Record`\<`string`, `any`\>, `number`\> |

#### Returns

`any`

#### Defined in

[src/app.ts:15](https://github.com/PalisadoesFoundation/talawa-api/blob/2c2e70a/src/app.ts#L15)

▸ **default**(`req`, `res`, `next`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\> |
| `res` | `Response`\<`any`, `Record`\<`string`, `any`\>, `number`\> |
| `next` | `NextFunction` |

#### Returns

`void`

#### Defined in

[src/app.ts:15](https://github.com/PalisadoesFoundation/talawa-api/blob/2c2e70a/src/app.ts#L15)
