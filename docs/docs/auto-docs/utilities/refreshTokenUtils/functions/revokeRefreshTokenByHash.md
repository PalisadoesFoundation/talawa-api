[API Docs](/)

***

# Function: revokeRefreshTokenByHash()

> **revokeRefreshTokenByHash**(`drizzleClient`, `tokenHash`): `Promise`\<`boolean`\>

Defined in: [src/utilities/refreshTokenUtils.ts:105](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/refreshTokenUtils.ts#L105)

Revokes a refresh token by setting its revokedAt timestamp.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### tokenHash

`string`

The hashed refresh token to revoke

## Returns

`Promise`\<`boolean`\>

- True if token was revoked, false if not found or already revoked
