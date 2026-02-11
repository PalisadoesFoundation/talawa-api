[API Docs](/)

***

# Function: rotateRefresh()

> **rotateRefresh**(`db`, `_log`, `token`): `Promise`\<[`RotateRefreshResult`](../type-aliases/RotateRefreshResult.md)\>

Defined in: [src/services/auth/authService.ts:152](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/authService.ts#L152)

Rotates a refresh token: revokes the old one and issues new access and refresh tokens.
Returns invalid_refresh if the token is expired, invalid, wrong type, or not found in DB.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

### \_log

`FastifyBaseLogger`

### token

`string`

## Returns

`Promise`\<[`RotateRefreshResult`](../type-aliases/RotateRefreshResult.md)\>
