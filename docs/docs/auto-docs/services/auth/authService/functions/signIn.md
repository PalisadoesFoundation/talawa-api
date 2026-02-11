[API Docs](/)

***

# Function: signIn()

> **signIn**(`db`, `_log`, `input`): `Promise`\<[`SignInResult`](../type-aliases/SignInResult.md)\>

Defined in: [src/services/auth/authService.ts:110](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/authService.ts#L110)

Authenticates a user by email and password. Returns user and tokens or invalid_credentials.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

### \_log

`FastifyBaseLogger`

### input

[`SignInInput`](../interfaces/SignInInput.md)

## Returns

`Promise`\<[`SignInResult`](../type-aliases/SignInResult.md)\>
