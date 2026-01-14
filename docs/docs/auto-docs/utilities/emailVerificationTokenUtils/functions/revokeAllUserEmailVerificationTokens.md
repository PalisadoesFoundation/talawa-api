[API Docs](/)

***

# Function: revokeAllUserEmailVerificationTokens()

> **revokeAllUserEmailVerificationTokens**(`drizzleClient`, `userId`): `Promise`\<`number`\>

Defined in: [src/utilities/emailVerificationTokenUtils.ts:173](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/emailVerificationTokenUtils.ts#L173)

Revokes all email verification tokens for a user (marks them as used).
Useful when user successfully verifies email or requests a new token.

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
