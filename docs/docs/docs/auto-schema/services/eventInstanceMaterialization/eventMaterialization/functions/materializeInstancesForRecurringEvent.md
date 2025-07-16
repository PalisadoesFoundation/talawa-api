[Admin Docs](/)

***

# Function: materializeInstancesForRecurringEvent()

> **materializeInstancesForRecurringEvent**(`input`, `drizzleClient`, `logger`): `Promise`\<`number`\>

Defined in: [src/services/eventInstanceMaterialization/eventMaterialization.ts:17](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/eventMaterialization.ts#L17)

Creates materialized instances for a recurring event within a time window.

## Parameters

### input

[`MaterializeInstancesInput`](../../types/interfaces/MaterializeInstancesInput.md)

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`number`\>
