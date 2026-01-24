[**talawa-api**](../../../README.md)

***

# Function: findValidEmailVerificationToken()

> **findValidEmailVerificationToken**(`db`, `tokenHash`): `Promise`\<\{ `expiresAt`: `Date`; `id`: `string`; `userId`: `string`; \} \| `undefined`\>

Defined in: [src/utilities/emailVerificationTokenUtils.ts:99](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/emailVerificationTokenUtils.ts#L99)

Finds a valid (non-expired, non-used) email verification token by its hash.

Note: All conditions (hash match, not expired, not used) are combined in a single
database query for defense-in-depth against timing attacks. While the 256-bit
token entropy makes timing attacks impractical, this approach returns consistent
timing regardless of token state.

## Parameters

### db

`PostgresJsDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

### tokenHash

`string`

The hashed email verification token to look up

## Returns

`Promise`\<\{ `expiresAt`: `Date`; `id`: `string`; `userId`: `string`; \} \| `undefined`\>

- The email verification token record if found and valid, undefined otherwise
