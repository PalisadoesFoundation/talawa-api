[Admin Docs](/)

***

# Function: getOrganizationCleanupStatus()

> **getOrganizationCleanupStatus**(`organizationId`, `drizzleClient`): `Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `Date`; `retentionCutoffDate`: `Date`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:220](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventCleanupWorker.ts#L220)

Retrieves the cleanup status for a specific organization, including the number of instances
eligible for cleanup and the current retention settings.

## Parameters

### organizationId

`string`

The ID of the organization to get the status for.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

## Returns

`Promise`\<\{ `instancesEligibleForCleanup`: `number`; `lastCleanupDate`: `Date`; `retentionCutoffDate`: `Date`; `retentionMonths`: `number`; `totalInstances`: `number`; \}\>

A promise that resolves to an object with the cleanup status details.
