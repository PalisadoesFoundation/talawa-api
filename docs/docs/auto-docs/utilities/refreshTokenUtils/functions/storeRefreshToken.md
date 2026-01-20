[API Docs](/)

***

# Function: storeRefreshToken()

> **storeRefreshToken**(`drizzleClient`, `userId`, `tokenHash`, `expiresAt`): `Promise`\<\{ `id`: `string`; \}\>

Defined in: [src/utilities/refreshTokenUtils.ts:38](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/refreshTokenUtils.ts#L38)

Stores a refresh token in the database.

## Parameters

### drizzleClient

`PostgresJsDatabase`\<[API Docs](/)\>

The Drizzle database client

### userId

`string`

The user ID to associate with the token

### tokenHash

`string`

The hashed refresh token

### expiresAt

`Date`

The expiration date of the token

## Returns

`Promise`\<\{ `id`: `string`; \}\>

- The created refresh token record
