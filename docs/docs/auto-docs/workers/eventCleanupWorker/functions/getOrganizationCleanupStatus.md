[API Docs](/)

***

# Function: getOrganizationCleanupStatus()

> **getOrganizationCleanupStatus**(`organizationId`, `drizzleClient`): `Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `Date` \| `null`; `retentionCutoffDate`: `Date` \| `null`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:217](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/workers/eventCleanupWorker.ts#L217)

Retrieves the cleanup status for a specific organization, including the number of instances
eligible for cleanup and the current retention settings.

## Parameters

### organizationId

`string`

The ID of the organization to get the status for.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

## Returns

`Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `Date` \| `null`; `retentionCutoffDate`: `Date` \| `null`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>

- A promise that resolves to an object with the cleanup status details.
