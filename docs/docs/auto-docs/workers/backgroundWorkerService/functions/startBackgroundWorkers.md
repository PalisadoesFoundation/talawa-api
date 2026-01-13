[API Docs](/)

***

# Function: startBackgroundWorkers()

> **startBackgroundWorkers**(`drizzleClient`, `logger`, `fastify?`): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/backgroundWorkerService.ts#L58)

Initializes and starts all background workers, scheduling them to run at their configured intervals.

## Parameters

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

Database client for database operations

### logger

`FastifyBaseLogger`

Logger instance for logging

### fastify?

`FastifyInstance`\<`RawServerDefault`, `IncomingMessage`, `ServerResponse`\<`IncomingMessage`\>, `FastifyBaseLogger`, `FastifyTypeProviderDefault`\>

Optional Fastify instance for accessing performance snapshots

## Returns

`Promise`\<`void`\>
