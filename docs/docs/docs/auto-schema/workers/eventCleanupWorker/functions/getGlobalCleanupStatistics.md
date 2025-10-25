[Admin Docs](/)

***

# Function: getGlobalCleanupStatistics()

> **getGlobalCleanupStatistics**(`drizzleClient`): `Promise`\<\{ `averageInstancesPerOrganization`: `number`; `newestInstanceDate`: `null` \| `Date`; `oldestInstanceDate`: `null` \| `Date`; `totalInstances`: `number`; `totalInstancesEligibleForCleanup`: `number`; `totalOrganizations`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:332](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/workers/eventCleanupWorker.ts#L332)

Retrieves global statistics about the cleanup process across all organizations,
including total instance counts and eligibility for cleanup.

## Parameters

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

## Returns

`Promise`\<\{ `averageInstancesPerOrganization`: `number`; `newestInstanceDate`: `null` \| `Date`; `oldestInstanceDate`: `null` \| `Date`; `totalInstances`: `number`; `totalInstancesEligibleForCleanup`: `number`; `totalOrganizations`: `number`; \}\>

A promise that resolves to an object with the global cleanup statistics.
