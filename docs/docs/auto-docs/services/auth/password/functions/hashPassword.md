[API Docs](/)

***

# Function: hashPassword()

> **hashPassword**(`plain`): `Promise`\<`string`\>

Defined in: [src/services/auth/password.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/password.ts#L24)

Hashes a plain-text password using Argon2id.

## Parameters

### plain

`string`

Plain-text password to hash.

## Returns

`Promise`\<`string`\>

The argon2id hash string.
