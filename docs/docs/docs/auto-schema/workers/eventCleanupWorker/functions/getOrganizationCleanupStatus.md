[Admin Docs](/)

***

# Function: getOrganizationCleanupStatus()

> **getOrganizationCleanupStatus**(`organizationId`, `drizzleClient`): `Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `null` \| `Date`; `retentionCutoffDate`: `null` \| `Date`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:217](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/workers/eventCleanupWorker.ts#L217)

Retrieves the cleanup status for a specific organization, including the number of instances
eligible for cleanup and the current retention settings.

## Parameters

### organizationId

`string`

The ID of the organization to get the status for.

### drizzleClient

`NodePgDatabase`\<``drizzle/schema``\>

## Returns

`Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `null` \| `Date`; `retentionCutoffDate`: `null` \| `Date`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>

A promise that resolves to an object with the cleanup status details.
