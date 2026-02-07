[API Docs](/)

***

# Function: revokeRefreshToken()

> **revokeRefreshToken**(`db`, `token`): `Promise`\<`void`\>

Defined in: [src/services/auth/refreshStore.ts:47](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L47)

Revokes a refresh token by setting revokedAt.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

### token

`string`

## Returns

`Promise`\<`void`\>
