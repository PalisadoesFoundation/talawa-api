[Admin Docs](/)

***

# Function: getCleanupStats()

> **getCleanupStats**(`organizationId`, `drizzleClient`): `Promise`\<\{ `instancesEligibleForCleanup`: `number`; `instancesInRetentionWindow`: `number`; `retentionStartDate`: `null` \| `Date`; `totalInstances`: `number`; \}\>

Defined in: [src/services/eventGeneration/windowManager.ts:216](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/services/eventGeneration/windowManager.ts#L216)

Retrieves cleanup statistics for an organization, including the total number of instances,
the number of instances within the retention window, and the number eligible for cleanup.

## Parameters

### organizationId

`string`

The ID of the organization to get stats for.

### drizzleClient

`NodePgDatabase`\<``drizzle/schema``\>

The Drizzle ORM client for database access.

## Returns

`Promise`\<\{ `instancesEligibleForCleanup`: `number`; `instancesInRetentionWindow`: `number`; `retentionStartDate`: `null` \| `Date`; `totalInstances`: `number`; \}\>

A promise that resolves to an object containing the cleanup statistics.
