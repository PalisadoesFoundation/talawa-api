[API Docs](/)

***

# Type Alias: RefreshClaims

> **RefreshClaims** = `JWTPayload` & `object`

Defined in: [src/services/auth/tokens.ts:68](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/tokens.ts#L68)

Payload shape for refresh tokens. Extends jose JWTPayload so callers see iss, iat, exp, jti.

## Type Declaration

### jti

> **jti**: `string`

### sub

> **sub**: `string`

### typ

> **typ**: `"refresh"`

### ver

> **ver**: `1`
