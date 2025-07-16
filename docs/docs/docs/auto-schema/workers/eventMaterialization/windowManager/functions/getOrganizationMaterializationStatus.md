[Admin Docs](/)

***

# Function: getOrganizationMaterializationStatus()

> **getOrganizationMaterializationStatus**(`organizationId`, `deps`): `Promise`\<\{ `lastProcessedAt`: `Date`; `materializedInstancesCount`: `number`; `needsProcessing`: `boolean`; `processingPriority`: `number`; `recurringEventsCount`: `number`; `windowConfig`: \{ `configurationNotes`: `string`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `string`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `Date`; \}; \}\>

Defined in: [src/workers/eventMaterialization/windowManager.ts:169](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/workers/eventMaterialization/windowManager.ts#L169)

Gets materialization status for an organization.

## Parameters

### organizationId

`string`

### deps

[`WorkerDependencies`](../interfaces/WorkerDependencies.md)

## Returns

`Promise`\<\{ `lastProcessedAt`: `Date`; `materializedInstancesCount`: `number`; `needsProcessing`: `boolean`; `processingPriority`: `number`; `recurringEventsCount`: `number`; `windowConfig`: \{ `configurationNotes`: `string`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `string`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `Date`; \}; \}\>
