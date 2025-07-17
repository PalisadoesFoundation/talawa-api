[Admin Docs](/)

***

# Function: materializeInstancesForRecurringEvent()

> **materializeInstancesForRecurringEvent**(`input`, `drizzleClient`, `logger`): `Promise`\<`number`\>

Defined in: [src/services/eventInstanceMaterialization/eventMaterialization.ts:25](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/eventMaterialization.ts#L25)

Generates and stores materialized instances for a recurring event within a specified time window.
This function fetches the base event template and recurrence rule, calculates all occurrences,
and creates new instances in the database, avoiding duplicates.

## Parameters

### input

[`MaterializeInstancesInput`](../../types/interfaces/MaterializeInstancesInput.md)

The input object containing the event ID, time window, and organization ID.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`number`\>

A promise that resolves to the number of newly created materialized instances.
