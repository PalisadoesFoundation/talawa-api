[Admin Docs](/)

***

# Function: runMaterializationWorker()

> **runMaterializationWorker**(`config`, `drizzleClient`, `logger`): `Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>

Defined in: [src/workers/eventMaterialization/workerOrchestrator.ts:41](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventMaterialization/workerOrchestrator.ts#L41)

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
