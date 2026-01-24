[**talawa-api**](../../../README.md)

***

# Function: findValidRefreshToken()

> **findValidRefreshToken**(`drizzleClient`, `tokenHash`): `Promise`\<\{ `expiresAt`: `Date`; `id`: `string`; `revokedAt`: `Date` \| `null`; `userId`: `string`; \} \| `undefined`\>

Defined in: src/utilities/refreshTokenUtils.ts:66

Finds a valid (non-expired, non-revoked) refresh token by its hash.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

The Drizzle database client

### tokenHash

`string`

The hashed refresh token to look up

## Returns

`Promise`\<\{ `expiresAt`: `Date`; `id`: `string`; `revokedAt`: `Date` \| `null`; `userId`: `string`; \} \| `undefined`\>

- The refresh token record if found and valid, undefined otherwise
