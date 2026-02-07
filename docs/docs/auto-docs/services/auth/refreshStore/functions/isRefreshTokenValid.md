[API Docs](/)

***

# Function: isRefreshTokenValid()

> **isRefreshTokenValid**(`db`, `token`, `userId`): `Promise`\<`boolean`\>

Defined in: [src/services/auth/refreshStore.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/refreshStore.ts#L61)

Returns true only if a row exists for the given userId and token hash,
and it is not revoked and not expired.

## Parameters

### db

[`DrizzleClient`](../../../../fastifyPlugins/drizzleClient/type-aliases/DrizzleClient.md)

### token

`string`

### userId

`string`

## Returns

`Promise`\<`boolean`\>
