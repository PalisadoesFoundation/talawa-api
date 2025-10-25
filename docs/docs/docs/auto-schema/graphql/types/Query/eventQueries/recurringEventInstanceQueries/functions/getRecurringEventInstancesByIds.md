[Admin Docs](/)

***

# Function: getRecurringEventInstancesByIds()

> **getRecurringEventInstancesByIds**(`instanceIds`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:96](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L96)

Retrieves multiple resolved recurring event instances by their specific IDs.
This function performs a batch operation to efficiently fetch and resolve instances,
avoiding the N+1 query problem.

## Parameters

### instanceIds

`string`[]

An array of recurring event instance IDs to retrieve.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

A promise that resolves to an array of the requested resolved recurring event event instances.
