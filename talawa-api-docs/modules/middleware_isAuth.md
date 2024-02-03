[talawa-api](../README.md) / [Exports](../modules.md) / middleware/isAuth

# Module: middleware/isAuth

## Table of contents

### Interfaces

- [InterfaceAuthData](../interfaces/middleware_isAuth.InterfaceAuthData.md)

### Functions

- [isAuth](middleware_isAuth.md#isauth)

## Functions

### isAuth

▸ **isAuth**(`request`): [`InterfaceAuthData`](../interfaces/middleware_isAuth.InterfaceAuthData.md)

This function determines whether the user is authorised and whether the access token has expired.

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `Request`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\> |

#### Returns

[`InterfaceAuthData`](../interfaces/middleware_isAuth.InterfaceAuthData.md)

Returns `authData` object with `isAuth`, `expired` and `userId` properties.

#### Defined in

[src/middleware/isAuth.ts:17](https://github.com/PalisadoesFoundation/talawa-api/blob/4e2c75b/src/middleware/isAuth.ts#L17)
