[API Docs](/)

***

# Function: markPasswordResetTokenAsUsed()

> **markPasswordResetTokenAsUsed**(`drizzleClient`, `tokenHash`): `Promise`\<`boolean`\>

Defined in: [src/utilities/passwordResetTokenUtils.ts:123](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordResetTokenUtils.ts#L123)

Marks a password reset token as used by setting its usedAt timestamp.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### tokenHash

`string`

The hashed password reset token to mark as used

## Returns

`Promise`\<`boolean`\>

True if token was marked as used, false if not found or already used
