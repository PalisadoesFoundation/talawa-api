[Admin Docs](/)

***

# Class: BackgroundWorkerService

Defined in: [src/workers/backgroundWorkerService.ts:22](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L22)

Background worker service that orchestrates all event materialization tasks.

This service manages:
- Event instance materialization (generating future instances)
- Instance cleanup (removing old instances)
- Worker scheduling and coordination
- Error handling and monitoring

## Constructors

### Constructor

> **new BackgroundWorkerService**(`drizzleClient`, `logger`): `BackgroundWorkerService`

Defined in: [src/workers/backgroundWorkerService.ts:29](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L29)

#### Parameters

##### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

##### logger

`FastifyBaseLogger`

#### Returns

`BackgroundWorkerService`

## Methods

### getStatus()

> **getStatus**(): `object`

Defined in: [src/workers/backgroundWorkerService.ts:204](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L204)

Gets the current status of the background worker service.

#### Returns

`object`

##### cleanupSchedule

> **cleanupSchedule**: `string`

##### isRunning

> **isRunning**: `boolean`

##### materializationSchedule

> **materializationSchedule**: `string`

##### nextCleanupRun?

> `optional` **nextCleanupRun**: `Date`

##### nextMaterializationRun?

> `optional` **nextMaterializationRun**: `Date`

***

### healthCheck()

> **healthCheck**(): `Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

Defined in: [src/workers/backgroundWorkerService.ts:222](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L222)

Health check for monitoring systems.

#### Returns

`Promise`\<\{ `details`: `Record`\<`string`, `unknown`\>; `status`: `"healthy"` \| `"unhealthy"`; \}\>

***

### start()

> **start**(): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:40](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L40)

Starts all background workers with their respective schedules.

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:91](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L91)

Stops all background workers and cleans up resources.

#### Returns

`Promise`\<`void`\>

***

### triggerCleanupWorker()

> **triggerCleanupWorker**(): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:192](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L192)

Manually triggers the cleanup worker (useful for testing/admin).

#### Returns

`Promise`\<`void`\>

***

### triggerMaterializationWorker()

> **triggerMaterializationWorker**(): `Promise`\<`void`\>

Defined in: [src/workers/backgroundWorkerService.ts:180](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L180)

Manually triggers the materialization worker (useful for testing/admin).

#### Returns

`Promise`\<`void`\>

***

### updateMaterializationConfig()

> **updateMaterializationConfig**(`config`): `void`

Defined in: [src/workers/backgroundWorkerService.ts:257](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/backgroundWorkerService.ts#L257)

Updates materialization worker configuration

#### Parameters

##### config

`Partial`\<[`WorkerConfig`](../../eventMaterialization/materializationPipeline/interfaces/WorkerConfig.md)\>

#### Returns

`void`
