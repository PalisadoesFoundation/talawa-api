[API Docs](/)

***

# Function: findValidPasswordResetToken()

> **findValidPasswordResetToken**(`drizzleClient`, `tokenHash`): `Promise`\<\{ `expiresAt`: `Date` \| `null`; `id`: `string`; `usedAt`: `Date` \| `null`; `userId`: `string`; \} \| `undefined`\>

Defined in: [src/utilities/passwordResetTokenUtils.ts:106](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordResetTokenUtils.ts#L106)

Finds a valid (non-expired, non-used) password reset token by its hash.

Note: All conditions (hash match, not expired, not used) are combined in a single
database query for defense-in-depth against timing attacks. While the 256-bit
token entropy makes timing attacks impractical, this approach returns consistent
timing regardless of token state.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### tokenHash

`string`

The hashed password reset token to look up

## Returns

`Promise`\<\{ `expiresAt`: `Date` \| `null`; `id`: `string`; `usedAt`: `Date` \| `null`; `userId`: `string`; \} \| `undefined`\>

- The password reset token record if found and valid, undefined otherwise
