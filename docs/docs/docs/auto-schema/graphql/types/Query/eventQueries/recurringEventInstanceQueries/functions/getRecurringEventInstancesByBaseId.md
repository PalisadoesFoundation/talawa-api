[Admin Docs](/)

***

# Function: getRecurringEventInstancesByBaseId()

> **getRecurringEventInstancesByBaseId**(`baseRecurringEventId`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:304](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L304)

Retrieves all recurring event instances that belong to a specific base recurring event template.

## Parameters

### baseRecurringEventId

`string`

The ID of the base recurring event template.

### drizzleClient

`NodePgDatabase`\<``drizzle/schema``\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

A promise that resolves to an array of fully resolved recurring event instances.
