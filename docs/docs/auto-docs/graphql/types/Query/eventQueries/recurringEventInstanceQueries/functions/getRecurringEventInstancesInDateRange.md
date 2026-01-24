[**talawa-api**](../../../../../../README.md)

***

# Function: getRecurringEventInstancesInDateRange()

> **getRecurringEventInstancesInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:38](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L38)

Retrieves recurring event instances for a given organization within a specified date range.
This function resolves each instance by combining data from the base event template
with any applicable exceptions, providing a complete and accurate representation of each event instance.

## Parameters

### input

[`GetRecurringEventInstancesInput`](../interfaces/GetRecurringEventInstancesInput.md)

The input object containing organizationId, date range, and optional filters.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

- A promise that resolves to an array of fully resolved recurring event instances.
