[API Docs](/)

***

# Function: consumePasswordChangeRateLimit()

> **consumePasswordChangeRateLimit**(`userId`): `void`

Defined in: [src/utilities/passwordChangeRateLimit.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L61)

Consumes one rate limit slot for the given user.
Creates or resets the entry as needed and increments the count.
Should be called only after a successful password update.

## Parameters

### userId

`string`

The user ID to record a consumption for

## Returns

`void`
