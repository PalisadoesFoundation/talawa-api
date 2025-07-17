[Admin Docs](/)

***

# Function: runSingleOrganizationWorker()

> **runSingleOrganizationWorker**(`organizationId`, `drizzleClient`, `logger`): `Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>

Defined in: [src/workers/eventMaterialization/materializationPipeline.ts:125](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/materializationPipeline.ts#L125)

Processes a specific organization manually

## Parameters

### organizationId

`string`

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<[`WorkerResult`](../interfaces/WorkerResult.md)\>
