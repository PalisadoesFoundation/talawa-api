[API Docs](/)

***

# Function: storePasswordResetToken()

> **storePasswordResetToken**(`drizzleClient`, `userId`, `tokenHash`, `expiresAt`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: src/utilities/passwordResetTokenUtils.ts:72

Stores a password reset token in the database.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### userId

`string`

The user ID to associate with the token

### tokenHash

`string`

The hashed password reset token

### expiresAt

The expiration date of the token, or null for tokens that never expire

`Date` | `null`

## Returns

`Promise`\<\{ `id`: `string`; \}\>

- The created password reset token record
