[Admin Docs](/)

***

# Function: runMaterializationWorker()

> **runMaterializationWorker**(`config`, `drizzleClient`, `logger`): `Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>

Defined in: [src/workers/eventGeneration/eventGenerationPipeline.ts:47](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/workers/eventGeneration/eventGenerationPipeline.ts#L47)

The main function for the materialization worker, orchestrating the entire pipeline
from job discovery to execution and post-processing.

## Parameters

### config

[`WorkerConfig`](../interfaces/WorkerConfig.md)

The configuration for the worker.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging the worker's progress and any errors.

## Returns

`Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>

A promise that resolves to a summary result of the worker's run.
