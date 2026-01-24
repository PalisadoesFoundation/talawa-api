[API Docs](/)

***

# Function: revokeAllUserRefreshTokens()

> **revokeAllUserRefreshTokens**(`drizzleClient`, `userId`): `Promise`\<`number`\>

Defined in: src/utilities/refreshTokenUtils.ts:129

Revokes all refresh tokens for a user (useful for logout from all devices).

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### userId

`string`

The user ID whose tokens should be revoked

## Returns

`Promise`\<`number`\>

- The number of tokens revoked
