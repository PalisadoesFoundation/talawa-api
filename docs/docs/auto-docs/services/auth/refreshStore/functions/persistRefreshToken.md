[API Docs](/)

***

# Function: persistRefreshToken()

> **persistRefreshToken**(`db`, `params`): `Promise`\<`void`\>

Defined in: [src/services/auth/refreshStore.ts:46](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L46)

Persists a refresh token in the database.
Stores only userId, tokenHash (SHA-256 of token), and expiresAt.
Throws if params.ttlSec is not positive (avoids immediately-expired tokens).

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

Drizzle client.

### params

[`PersistRefreshTokenParams`](../interfaces/PersistRefreshTokenParams.md)

Token, userId, ttlSec; ip/userAgent accepted but not persisted.

## Returns

`Promise`\<`void`\>

Promise that resolves when the insert completes.

## Throws

TalawaRestError with code INVALID_ARGUMENTS if params.ttlSec is not positive.
