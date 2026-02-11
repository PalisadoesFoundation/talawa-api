[API Docs](/)

***

# Function: signUp()

> **signUp**(`db`, `_log`, `input`): `Promise`\<[`SignUpResult`](../type-aliases/SignUpResult.md)\>

Defined in: [src/services/auth/authService.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/authService.ts#L57)

Registers a new user. Returns the created user or already_exists if email is taken.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

### \_log

`FastifyBaseLogger`

### input

[`SignUpInput`](../interfaces/SignUpInput.md)

## Returns

`Promise`\<[`SignUpResult`](../type-aliases/SignUpResult.md)\>
