[API Docs](/)

***

# Function: warmCacheSafely()

> **warmCacheSafely**(`drizzleClient`, `cache`, `logger`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:200](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L200)

Warms the cache with frequently accessed entities on startup.
Pre-fetches top organizations to reduce cache misses for common queries.

## Parameters

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

### cache

[`CacheService`](../../../services/caching/CacheService/interfaces/CacheService.md)

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`void`\>
