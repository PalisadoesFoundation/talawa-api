[**talawa-api**](../../../README.md)

***

# Function: hashPasswordResetToken()

> **hashPasswordResetToken**(`token`): `string`

Defined in: [src/utilities/passwordResetTokenUtils.ts:53](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/passwordResetTokenUtils.ts#L53)

Creates a HMAC-SHA-256 hash of a password reset token for secure storage.

Note: HMAC-SHA-256 is appropriate here (not argon2/bcrypt) because:
- The token is cryptographically random (256 bits of entropy)
- Brute-force attacks are computationally infeasible
- This matches the pattern used for refresh tokens in this codebase

## Parameters

### token

`string`

The raw password reset token

## Returns

`string`

- The hashed token
