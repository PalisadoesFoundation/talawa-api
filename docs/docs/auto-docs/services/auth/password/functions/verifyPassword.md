[API Docs](/)

***

# Function: verifyPassword()

> **verifyPassword**(`hashStr`, `plain`): `Promise`\<`boolean`\>

Defined in: [src/services/auth/password.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/password.ts#L33)

Verifies a plain-text password against an argon2id hash.

## Parameters

### hashStr

`string`

Stored hash string (e.g. from database).

### plain

`string`

Plain-text password to check.

## Returns

`Promise`\<`boolean`\>

True if the password matches; false on wrong password or invalid hash (never throws).
