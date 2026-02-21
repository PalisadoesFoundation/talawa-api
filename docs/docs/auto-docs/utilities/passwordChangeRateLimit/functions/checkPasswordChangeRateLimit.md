[API Docs](/)

***

# Function: checkPasswordChangeRateLimit()

> **checkPasswordChangeRateLimit**(`userId`): `boolean`

Defined in: [src/utilities/passwordChangeRateLimit.ts:37](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L37)

Checks if a user is currently under the rate limit for password change requests.
This is a pure check that does not mutate state.

## Parameters

### userId

`string`

The user ID to check

## Returns

`boolean`

true if request is allowed, false if rate limit exceeded
