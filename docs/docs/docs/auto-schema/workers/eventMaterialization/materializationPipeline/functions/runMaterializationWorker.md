[Admin Docs](/)

***

# Function: runMaterializationWorker()

> **runMaterializationWorker**(`config`, `drizzleClient`, `logger`): `Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>

Defined in: [src/workers/eventMaterialization/materializationPipeline.ts:41](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/materializationPipeline.ts#L41)

Main materialization worker function - simplified and focused

## Parameters

### config

[`WorkerConfig`](../interfaces/WorkerConfig.md)

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>
