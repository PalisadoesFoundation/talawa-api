[API Docs](/)

***

# Function: checkEmailVerificationRateLimit()

> **checkEmailVerificationRateLimit**(`userId`): `boolean`

Defined in: src/utilities/emailVerificationRateLimit.ts:28

Checks if a user has exceeded the rate limit for email verification requests.
Uses a fixed window approach (entire window resets when it expires).

## Parameters

### userId

`string`

The user ID to check

## Returns

`boolean`

true if request is allowed, false if rate limit exceeded
