[API Docs](/)

***

# Function: checkPasswordChangeRateLimit()

> **checkPasswordChangeRateLimit**(`cache`, `userId`, `logger`, `config?`): `Promise`\<`void`\>

Defined in: [src/utilities/passwordChangeRateLimit.ts:49](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L49)

Checks if a user has exceeded the rate limit for password changes.
Uses Redis via CacheService with a fixed time window.

## Parameters

### cache

[`RateLimitCache`](../type-aliases/RateLimitCache.md)

The cache instance (Redis-backed)

### userId

`string`

The user ID to check

### logger

[`RateLimitLogger`](../type-aliases/RateLimitLogger.md)

Logger for violation logging

### config?

[`PasswordChangeRateLimitConfig`](../interfaces/PasswordChangeRateLimitConfig.md)

Optional configurable limits

## Returns

`Promise`\<`void`\>

## Throws

TalawaGraphQLError with code "too_many_requests" and httpStatus 429
