[API Docs](/)

***

# Function: signAccessToken()

> **signAccessToken**(`user`): `Promise`\<`string`\>

Defined in: [src/services/auth/tokens.ts:70](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/tokens.ts#L70)

Signs an access JWT for a user.

## Parameters

### user

Object with id and email.

#### email

`string`

#### id

`string`

## Returns

`Promise`\<`string`\>

Signed JWT string.
