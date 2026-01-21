[API Docs](/)

***

# Function: getRecurringEventInstancesByBaseIds()

> **getRecurringEventInstancesByBaseIds**(`baseRecurringEventIds`, `drizzleClient`, `logger`, `options`): `Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:244](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L244)

Retrieves all recurring event instances for multiple base recurring event templates.
This is a batch version of getRecurringEventInstancesByBaseId to avoid N+1 queries.

## Parameters

### baseRecurringEventIds

`string`[]

Array of base recurring event template IDs.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client.

### logger

`FastifyBaseLogger`

The logger.

### options

#### excludeInstanceIds?

`string`[]

#### includeCancelled?

`boolean`

#### limit?

`number`

## Returns

`Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)[]\>

- Promise resolving to array of resolved instances.
