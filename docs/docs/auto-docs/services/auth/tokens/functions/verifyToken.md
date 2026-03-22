[API Docs](/)

***

# Function: verifyToken()

> **verifyToken**\<`T`\>(`jwt`): `Promise`\<`T`\>

Defined in: [src/services/auth/tokens.ts:148](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/tokens.ts#L148)

Verifies a JWT and returns the payload. Throws on expired, wrong secret, or wrong issuer.

## Type Parameters

### T

`T` = `any`

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
TODO: Add an expectedTyp parameter and runtime payload.typ check (e.g. verifyToken(jwt, "access"))
to enforce access vs refresh token usage in route/middleware integration; validate payload.typ
before returning to avoid token-type confusion. Track: jwtVerify -> payload as T.
