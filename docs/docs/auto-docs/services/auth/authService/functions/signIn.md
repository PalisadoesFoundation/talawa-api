[API Docs](/)

***

# Function: signIn()

> **signIn**(`db`, `_log`, `input`): `Promise`\<[`SignInResult`](../type-aliases/SignInResult.md)\>

Defined in: [src/services/auth/authService.ts:126](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/authService.ts#L126)

Authenticates a user by email and password.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

Drizzle client for database access.

### \_log

`FastifyBaseLogger`

Logger (unused; reserved for future use).

### input

[`SignInInput`](../interfaces/SignInInput.md)

SignInInput (email, password; optional ip, userAgent).

## Returns

`Promise`\<[`SignInResult`](../type-aliases/SignInResult.md)\>

Promise resolving to SignInResult: either { user, access, refresh } with the user row and JWT strings, or { error: "invalid_credentials" } if the user is not found or the password does not match.
