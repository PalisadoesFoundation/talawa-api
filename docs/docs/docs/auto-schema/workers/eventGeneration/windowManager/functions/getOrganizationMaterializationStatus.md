[Admin Docs](/)

***

# Function: getOrganizationMaterializationStatus()

> **getOrganizationMaterializationStatus**(`organizationId`, `deps`): `Promise`\<\{ `lastProcessedAt`: `null` \| `Date`; `materializedInstancesCount`: `number`; `needsProcessing`: `boolean`; `processingPriority`: `number`; `recurringEventsCount`: `number`; `windowConfig`: `null` \| \{ `configurationNotes`: `null` \| `string`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `null` \| `string`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `null` \| `Date`; \}; \}\>

Defined in: [src/workers/eventGeneration/windowManager.ts:163](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventGeneration/windowManager.ts#L163)

Gets materialization status for an organization.

## Parameters

### organizationId

`string`

### deps

[`WorkerDependencies`](../interfaces/WorkerDependencies.md)

## Returns

`Promise`\<\{ `lastProcessedAt`: `null` \| `Date`; `materializedInstancesCount`: `number`; `needsProcessing`: `boolean`; `processingPriority`: `number`; `recurringEventsCount`: `number`; `windowConfig`: `null` \| \{ `configurationNotes`: `null` \| `string`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `null` \| `string`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `null` \| `Date`; \}; \}\>
