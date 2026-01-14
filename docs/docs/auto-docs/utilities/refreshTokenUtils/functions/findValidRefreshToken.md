[**talawa-api**](../../../README.md)

***

# Function: findValidRefreshToken()

> **findValidRefreshToken**(`drizzleClient`, `tokenHash`): `Promise`\<\{ `expiresAt`: `Date`; `id`: `string`; `revokedAt`: `Date` \| `null`; `userId`: `string`; \} \| `undefined`\>

Defined in: [src/utilities/refreshTokenUtils.ts:66](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/refreshTokenUtils.ts#L66)

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
