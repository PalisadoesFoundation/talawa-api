[Admin Docs](/)

***

# Function: cleanupSpecificOrganization()

> **cleanupSpecificOrganization**(`organizationId`, `drizzleClient`, `logger`): `Promise`\<\{ `instancesDeleted`: `number`; `retentionCutoffDate`: `Date`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:167](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventCleanupWorker.ts#L167)

Manually triggers a cleanup of old instances for a specific organization.

## Parameters

### organizationId

`string`

The ID of the organization to clean up.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `instancesDeleted`: `number`; `retentionCutoffDate`: `Date`; \}\>

A promise that resolves to an object containing the number of deleted instances
         and the retention cutoff date used.
