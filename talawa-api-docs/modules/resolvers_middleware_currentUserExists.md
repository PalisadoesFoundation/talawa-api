[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/middleware/currentUserExists

# Module: resolvers/middleware/currentUserExists

## Table of contents

### Functions

- [currentUserExists](resolvers_middleware_currentUserExists.md#currentuserexists)

## Functions

### currentUserExists

▸ **currentUserExists**(): (`next`: (`root`: `any`, `args`: `any`, `context`: `any`, `info`: `any`) =\> `any`) =\> (`root`: `any`, `args`: `any`, `context`: \{ `userId`: `any`  \}, `info`: `any`) =\> `Promise`\<`any`\>

#### Returns

`fn`

▸ (`next`): (`root`: `any`, `args`: `any`, `context`: \{ `userId`: `any`  \}, `info`: `any`) =\> `Promise`\<`any`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `next` | (`root`: `any`, `args`: `any`, `context`: `any`, `info`: `any`) =\> `any` |

##### Returns

`fn`

▸ (`root`, `args`, `context`, `info`): `Promise`\<`any`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `root` | `any` |
| `args` | `any` |
| `context` | `Object` |
| `context.userId` | `any` |
| `info` | `any` |

##### Returns

`Promise`\<`any`\>

#### Defined in

[src/resolvers/middleware/currentUserExists.ts:8](https://github.com/PalisadoesFoundation/talawa-api/blob/b1dd6c9/src/resolvers/middleware/currentUserExists.ts#L8)
