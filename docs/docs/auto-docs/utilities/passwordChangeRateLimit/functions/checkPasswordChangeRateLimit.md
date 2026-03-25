[API Docs](/)

***

# Function: checkPasswordChangeRateLimit()

> **checkPasswordChangeRateLimit**(`cache`, `userId`): `Promise`\<`void`\>

Defined in: [src/utilities/passwordChangeRateLimit.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/passwordChangeRateLimit.ts#L32)

Checks if a user has exceeded the rate limit for password changes.
Uses Redis via CacheService with automatic TTL-based expiration.

## Parameters

### cache

[`RateLimitCache`](../type-aliases/RateLimitCache.md)

The CacheService instance (Redis-backed)

### userId

`string`

The user ID to check

## Returns

`Promise`\<`void`\>

## Throws

TalawaGraphQLError with code "too_many_requests" if rate limit exceeded
