[API Docs](/)

***

# Function: getCleanupStats()

> **getCleanupStats**(`organizationId`, `drizzleClient`): `Promise`\<\{ `instancesEligibleForCleanup`: `number`; `instancesInRetentionWindow`: `number`; `retentionStartDate`: `Date` \| `null`; `totalInstances`: `number`; \}\>

Defined in: [src/services/eventGeneration/windowManager.ts:245](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/windowManager.ts#L245)

Retrieves cleanup statistics for an organization, including the total number of instances,
the number of instances within the retention window, and the number eligible for cleanup.

## Parameters

### organizationId

`string`

The ID of the organization to get stats for.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client for database access.

## Returns

`Promise`\<\{ `instancesEligibleForCleanup`: `number`; `instancesInRetentionWindow`: `number`; `retentionStartDate`: `Date` \| `null`; `totalInstances`: `number`; \}\>

- A promise that resolves to an object containing the cleanup statistics.
