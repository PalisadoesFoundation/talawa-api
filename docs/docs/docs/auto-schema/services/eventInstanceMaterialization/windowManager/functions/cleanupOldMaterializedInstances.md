[Admin Docs](/)

***

# Function: cleanupOldMaterializedInstances()

> **cleanupOldMaterializedInstances**(`organizationId`, `drizzleClient`, `logger`): `Promise`\<`number`\>

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:141](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/windowManager.ts#L141)

Cleans up old materialized instances beyond the retention window.

## Parameters

### organizationId

`string`

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`number`\>
