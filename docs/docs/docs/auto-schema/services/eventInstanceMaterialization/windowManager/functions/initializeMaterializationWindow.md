[Admin Docs](/)

***

# Function: initializeMaterializationWindow()

> **initializeMaterializationWindow**(`input`, `drizzleClient`, `logger`): `Promise`\<\{ `configurationNotes`: `string`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `string`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `Date`; \}\>

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:11](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/services/eventInstanceMaterialization/windowManager.ts#L11)

Initializes materialization window for an organization.
Uses 12-month default for never-ending events.

## Parameters

### input

[`CreateMaterializationWindowInput`](../../../../drizzle/tables/eventMaterializationWindows/type-aliases/CreateMaterializationWindowInput.md)

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `configurationNotes`: `string`; `createdAt`: `Date`; `createdById`: `string`; `currentWindowEndDate`: `Date`; `historyRetentionMonths`: `number`; `hotWindowMonthsAhead`: `number`; `id`: `string`; `isEnabled`: `boolean`; `lastProcessedAt`: `Date`; `lastProcessedInstanceCount`: `number`; `lastUpdatedById`: `string`; `maxInstancesPerRun`: `number`; `organizationId`: `string`; `processingPriority`: `number`; `retentionStartDate`: `Date`; `updatedAt`: `Date`; \}\>
