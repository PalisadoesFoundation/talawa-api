[Admin Docs](/)

***

# Function: materializeInstancesForRecurringEvent()

> **materializeInstancesForRecurringEvent**(`input`, `drizzleClient`, `logger`): `Promise`\<`number`\>

Defined in: [src/services/eventInstanceMaterialization/eventMaterialization.ts:18](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/services/eventInstanceMaterialization/eventMaterialization.ts#L18)

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
