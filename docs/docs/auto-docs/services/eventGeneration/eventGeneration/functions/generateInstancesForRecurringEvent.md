[API Docs](/)

***

# Function: generateInstancesForRecurringEvent()

> **generateInstancesForRecurringEvent**(`input`, `drizzleClient`, `logger`): `Promise`\<`number`\>

Defined in: src/services/eventGeneration/eventGeneration.ts:25

Generates and stores generated instances for a recurring event within a specified time window.
This function fetches the base event template and recurrence rule, calculates all occurrences,
and creates new instances in the database, avoiding duplicates.

## Parameters

### input

[`GenerateInstancesInput`](../../types/interfaces/GenerateInstancesInput.md)

The input object containing the event ID, time window, and organization ID.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`number`\>

- A promise that resolves to the number of newly created generated instances.
