[API Docs](/)

***

# Function: persistRefreshToken()

> **persistRefreshToken**(`db`, `params`): `Promise`\<`void`\>

Defined in: [src/services/auth/refreshStore.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L32)

Persists a refresh token in the database.
Stores only userId, tokenHash (SHA-256 of token), and expiresAt.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

### params

[`PersistRefreshTokenParams`](../interfaces/PersistRefreshTokenParams.md)

## Returns

`Promise`\<`void`\>
