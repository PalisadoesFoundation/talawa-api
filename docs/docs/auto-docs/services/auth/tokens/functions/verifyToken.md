[API Docs](/)

***

# Function: verifyToken()

> **verifyToken**\<`T`\>(`jwt`): `Promise`\<`T`\>

Defined in: [src/services/auth/tokens.ts:127](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/tokens.ts#L127)

Verifies a JWT and returns the payload. Throws on expired, wrong secret, or wrong issuer.

## Type Parameters

### T

`T` = [`AccessClaims`](../type-aliases/AccessClaims.md) \| [`RefreshClaims`](../type-aliases/RefreshClaims.md)

## Parameters

### jwt

`string`

Raw JWT string.

## Returns

`Promise`\<`T`\>

Decoded payload (typed by generic T).

## Remarks

The returned payload is not runtime-validated for `typ` (access vs refresh).
Callers must validate `payload.typ` themselves when distinguishing AccessClaims from RefreshClaims.
