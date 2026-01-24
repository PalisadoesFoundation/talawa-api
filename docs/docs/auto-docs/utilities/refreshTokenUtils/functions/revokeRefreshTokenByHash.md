[**talawa-api**](../../../README.md)

***

# Function: revokeRefreshTokenByHash()

> **revokeRefreshTokenByHash**(`drizzleClient`, `tokenHash`): `Promise`\<`boolean`\>

Defined in: [src/utilities/refreshTokenUtils.ts:105](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/refreshTokenUtils.ts#L105)

Revokes a refresh token by setting its revokedAt timestamp.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

The Drizzle database client

### tokenHash

`string`

The hashed refresh token to revoke

## Returns

`Promise`\<`boolean`\>

- True if token was revoked, false if not found or already revoked
