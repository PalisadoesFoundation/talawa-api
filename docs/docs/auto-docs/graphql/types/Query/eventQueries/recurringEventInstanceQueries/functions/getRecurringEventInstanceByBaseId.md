[API Docs](/)

***

# Function: getRecurringEventInstanceByBaseId()

> **getRecurringEventInstanceByBaseId**(`baseRecurringEventId`, `drizzleClient`, `logger`, `options`): `Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:214](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L214)

Retrieves all recurring event instances that belong to a specific base recurring event template.

## Parameters

### baseRecurringEventId

`string`

The ID of the base recurring event template.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

### options

#### excludeInstanceIds?

`string`[]

#### includeCancelled?

`boolean`

#### limit?

`number`

## Returns

`Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

- A promise that resolves to an array of fully resolved recurring event instances.
