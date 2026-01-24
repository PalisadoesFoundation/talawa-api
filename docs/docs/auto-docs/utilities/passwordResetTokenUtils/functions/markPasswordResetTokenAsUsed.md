[**talawa-api**](../../../README.md)

***

# Function: markPasswordResetTokenAsUsed()

> **markPasswordResetTokenAsUsed**(`drizzleClient`, `tokenHash`): `Promise`\<`boolean`\>

Defined in: src/utilities/passwordResetTokenUtils.ts:152

Marks a password reset token as used by setting its usedAt timestamp.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

The Drizzle database client

### tokenHash

`string`

The hashed password reset token to mark as used

## Returns

`Promise`\<`boolean`\>

- True if token was marked as used, false if not found or already used
