[Admin Docs](/)

***

# Function: cleanupOldGeneratedInstances()

> **cleanupOldGeneratedInstances**(`organizationId`, `drizzleClient`, `logger`): `Promise`\<`number`\>

Defined in: [src/services/eventGeneration/windowManager.ts:158](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/services/eventGeneration/windowManager.ts#L158)

Deletes old Generated instances that fall outside the defined retention window
for a given organization.

## Parameters

### organizationId

`string`

The ID of the organization for which to clean up instances.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`number`\>

A promise that resolves to the number of deleted instances.
