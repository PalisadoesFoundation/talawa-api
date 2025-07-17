[Admin Docs](/)

***

# Function: runMaterializationWorker()

> **runMaterializationWorker**(`config`, `drizzleClient`, `logger`): `Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>

Defined in: [src/workers/eventMaterialization/materializationPipeline.ts:41](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/materializationPipeline.ts#L41)

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
