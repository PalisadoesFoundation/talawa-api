[API Docs](/)

***

# Function: storeEmailVerificationToken()

> **storeEmailVerificationToken**(`drizzleClient`, `userId`, `tokenHash`, `expiresAt`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: src/utilities/emailVerificationTokenUtils.ts:65

Stores an email verification token in the database.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### userId

`string`

The user ID to associate with the token

### tokenHash

`string`

The hashed email verification token

### expiresAt

`Date`

The expiration date of the token

## Returns

`Promise`\<\{ `id`: `string`; \}\>

- The created email verification token record
