[Admin Docs](/)

***

# Function: emergencyCleanupBefore()

> **emergencyCleanupBefore**(`cutoffDate`, `drizzleClient`, `logger`): `Promise`\<\{ `instancesDeleted`: `number`; `organizationsAffected`: `number`; \}\>

Defined in: [src/workers/eventCleanupWorker.ts:285](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/workers/eventCleanupWorker.ts#L285)

Performs an emergency cleanup of all materialized instances older than a specified
cutoff date, across all organizations. This method should be used with caution as it
bypasses individual retention settings.

## Parameters

### cutoffDate

`Date`

The date before which all instances will be deleted.

### drizzleClient

`NodePgDatabase`\<``drizzle/schema``\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `instancesDeleted`: `number`; `organizationsAffected`: `number`; \}\>

A promise that resolves to an object with the number of deleted instances
         and the number of affected organizations.
