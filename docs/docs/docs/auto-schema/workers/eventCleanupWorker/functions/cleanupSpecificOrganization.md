[Admin Docs](/)

***

# Function: cleanupSpecificOrganization()

> **cleanupSpecificOrganization**(`organizationId`, `drizzleClient`, `logger`): `Promise`\<\{ `instancesDeleted`: `number`; `retentionCutoffDate`: `Date`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:167](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/workers/eventCleanupWorker.ts#L167)

Manually triggers a cleanup of old instances for a specific organization.

## Parameters

### organizationId

`string`

The ID of the organization to clean up.

### drizzleClient

`NodePgDatabase`\<``drizzle/schema``\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `instancesDeleted`: `number`; `retentionCutoffDate`: `Date`; \}\>

A promise that resolves to an object containing the number of deleted instances
         and the retention cutoff date used.
