[**talawa-api**](../../../../README.md)

***

# Function: getOrganizationMaterializationStatus()

> **getOrganizationMaterializationStatus**(`organizationId`, `deps`): `Promise`\<\{ `lastProcessedAt`: `Date` \| `null`; `materializedInstancesCount`: `number`; `needsProcessing`: `boolean`; `processingPriority`: `number`; `recurringEventsCount`: `number`; `windowConfig`: \{ `configurationNotes`: `string` \| `null`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `string` \| `null`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `Date` \| `null`; \} \| `null`; \}\>

Defined in: src/workers/eventGeneration/windowManager.ts:169

Gets materialization status for an organization.

## Parameters

### organizationId

`string`

### deps

[`WorkerDependencies`](../interfaces/WorkerDependencies.md)

## Returns

`Promise`\<\{ `lastProcessedAt`: `Date` \| `null`; `materializedInstancesCount`: `number`; `needsProcessing`: `boolean`; `processingPriority`: `number`; `recurringEventsCount`: `number`; `windowConfig`: \{ `configurationNotes`: `string` \| `null`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `string` \| `null`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `Date` \| `null`; \} \| `null`; \}\>
