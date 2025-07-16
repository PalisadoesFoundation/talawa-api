[Admin Docs](/)

***

# Class: EventCleanupWorker

Defined in: [src/workers/eventCleanupWorker.ts:17](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventCleanupWorker.ts#L17)

Worker responsible for cleaning up old materialized event instances.

This worker:
- Removes materialized instances beyond the retention window
- Prevents database bloat from accumulating old instances
- Respects per-organization retention settings
- Provides cleanup statistics for monitoring

## Constructors

### Constructor

> **new EventCleanupWorker**(`drizzleClient`, `logger`): `EventCleanupWorker`

Defined in: [src/workers/eventCleanupWorker.ts:18](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventCleanupWorker.ts#L18)

#### Parameters

##### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

##### logger

`FastifyBaseLogger`

#### Returns

`EventCleanupWorker`

## Methods

### cleanupOldInstances()

> **cleanupOldInstances**(): `Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:26](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventCleanupWorker.ts#L26)

Main cleanup method - processes all organizations' retention policies.

#### Returns

`Promise`\<\{ `errorsEncountered`: `number`; `instancesDeleted`: `number`; `organizationsProcessed`: `number`; \}\>

***

### cleanupSpecificOrganization()

> **cleanupSpecificOrganization**(`organizationId`): `Promise`\<\{ `instancesDeleted`: `number`; `retentionCutoffDate`: `Date`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:161](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventCleanupWorker.ts#L161)

Manually cleans up instances for a specific organization.

#### Parameters

##### organizationId

`string`

#### Returns

`Promise`\<\{ `instancesDeleted`: `number`; `retentionCutoffDate`: `Date`; \}\>

***

### emergencyCleanupBefore()

> **emergencyCleanupBefore**(`cutoffDate`): `Promise`\<\{ `instancesDeleted`: `number`; `organizationsAffected`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:276](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventCleanupWorker.ts#L276)

Emergency cleanup method that removes ALL instances older than a specific date.
Use with caution - this ignores per-organization retention settings.

#### Parameters

##### cutoffDate

`Date`

#### Returns

`Promise`\<\{ `instancesDeleted`: `number`; `organizationsAffected`: `number`; \}\>

***

### getGlobalCleanupStatistics()

> **getGlobalCleanupStatistics**(): `Promise`\<\{ `averageInstancesPerOrganization`: `number`; `newestInstanceDate`: `Date`; `oldestInstanceDate`: `Date`; `totalInstances`: `number`; `totalInstancesEligibleForCleanup`: `number`; `totalOrganizations`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:316](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventCleanupWorker.ts#L316)

Gets overall cleanup statistics across all organizations.

#### Returns

`Promise`\<\{ `averageInstancesPerOrganization`: `number`; `newestInstanceDate`: `Date`; `oldestInstanceDate`: `Date`; `totalInstances`: `number`; `totalInstancesEligibleForCleanup`: `number`; `totalOrganizations`: `number`; \}\>

***

### getOrganizationCleanupStatus()

> **getOrganizationCleanupStatus**(`organizationId`): `Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `Date`; `retentionCutoffDate`: `Date`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:205](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventCleanupWorker.ts#L205)

Gets cleanup status for an organization.

#### Parameters

##### organizationId

`string`

#### Returns

`Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `Date`; `retentionCutoffDate`: `Date`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>
