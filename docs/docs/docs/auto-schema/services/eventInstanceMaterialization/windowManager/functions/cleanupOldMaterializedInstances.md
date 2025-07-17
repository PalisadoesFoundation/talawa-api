[Admin Docs](/)

***

# Function: cleanupOldMaterializedInstances()

> **cleanupOldMaterializedInstances**(`organizationId`, `drizzleClient`, `logger`): `Promise`\<`number`\>

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:163](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/windowManager.ts#L163)

Deletes old materialized instances that fall outside the defined retention window
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
