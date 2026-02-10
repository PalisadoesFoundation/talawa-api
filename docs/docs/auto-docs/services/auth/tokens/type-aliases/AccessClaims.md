[API Docs](/)

***

# Type Alias: AccessClaims

> **AccessClaims** = `JWTPayload` & `object`

Defined in: [src/services/auth/tokens.ts:60](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/tokens.ts#L60)

Payload shape for access tokens. Extends jose JWTPayload so callers see iss, iat, exp.

## Type Declaration

### email

> **email**: `string`

### sub

> **sub**: `string`

### typ

> **typ**: `"access"`

### ver

> **ver**: `1`
