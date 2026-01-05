[API Docs](/)

***

# Function: startBackgroundWorkers()

> **startBackgroundWorkers**(`drizzleClient`, `logger`, `cache?`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:27](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L27)

Initializes and starts all background workers, scheduling them to run at their configured intervals.

## Parameters

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The database client for queries.

### logger

`FastifyBaseLogger`

The logger instance.

### cache?

[`CacheService`](../../../services/caching/CacheService/interfaces/CacheService.md)

Optional cache service for cache warming on startup.

## Returns

`Promise`\<`void`\>
