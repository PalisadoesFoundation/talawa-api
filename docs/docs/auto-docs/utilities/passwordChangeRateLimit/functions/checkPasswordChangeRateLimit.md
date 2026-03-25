[API Docs](/)

***

# Function: checkPasswordChangeRateLimit()

> **checkPasswordChangeRateLimit**(`userId`): `boolean`

Defined in: [src/utilities/passwordChangeRateLimit.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L28)

Checks if a user has exceeded the rate limit for password change requests.
Uses a fixed window approach (entire window resets when it expires).

## Parameters

### userId

`string`

The user ID to check

## Returns

`boolean`

true if request is allowed, false if rate limit exceeded
