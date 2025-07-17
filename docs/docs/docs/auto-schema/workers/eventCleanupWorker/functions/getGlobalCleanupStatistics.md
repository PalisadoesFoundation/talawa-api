[Admin Docs](/)

***

# Function: getGlobalCleanupStatistics()

> **getGlobalCleanupStatistics**(`drizzleClient`): `Promise`\<\{ `averageInstancesPerOrganization`: `number`; `newestInstanceDate`: `Date`; `oldestInstanceDate`: `Date`; `totalInstances`: `number`; `totalInstancesEligibleForCleanup`: `number`; `totalOrganizations`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:338](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventCleanupWorker.ts#L338)

Retrieves global statistics about the cleanup process across all organizations,
including total instance counts and eligibility for cleanup.

## Parameters

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

## Returns

`Promise`\<\{ `averageInstancesPerOrganization`: `number`; `newestInstanceDate`: `Date`; `oldestInstanceDate`: `Date`; `totalInstances`: `number`; `totalInstancesEligibleForCleanup`: `number`; `totalOrganizations`: `number`; \}\>

A promise that resolves to an object with the global cleanup statistics.
