[API Docs](/)

***

# Function: markEmailVerificationTokenAsUsed()

> **markEmailVerificationTokenAsUsed**(`drizzleClient`, `tokenHash`): `Promise`\<`boolean`\>

Defined in: [src/utilities/emailVerificationTokenUtils.ts:143](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/emailVerificationTokenUtils.ts#L143)

Marks an email verification token as used by setting its usedAt timestamp.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### tokenHash

`string`

The hashed email verification token to mark as used

## Returns

`Promise`\<`boolean`\>

- True if token was marked as used, false if not found or already used
