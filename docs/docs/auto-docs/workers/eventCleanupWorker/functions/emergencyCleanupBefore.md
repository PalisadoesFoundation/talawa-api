[API Docs](/)

***

# Function: emergencyCleanupBefore()

> **emergencyCleanupBefore**(`cutoffDate`, `drizzleClient`, `logger`): `Promise`\<\{ `instancesDeleted`: `number`; `organizationsAffected`: `number`; \}\>

Defined in: src/workers/eventCleanupWorker.ts:285

Performs an emergency cleanup of all materialized instances older than a specified
cutoff date, across all organizations. This method should be used with caution as it
bypasses individual retention settings.

## Parameters

### cutoffDate

`Date`

The date before which all instances will be deleted.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<\{ `instancesDeleted`: `number`; `organizationsAffected`: `number`; \}\>

- A promise that resolves to an object with the number of deleted instances
         and the number of affected organizations.
