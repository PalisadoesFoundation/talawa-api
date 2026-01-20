[API Docs](/)

***

# Function: getRecurringEventInstanceById()

> **getRecurringEventInstanceById**(`instanceId`, `organizationId`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md) \| `null`\>

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:149](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L149)

Retrieves a single resolved recurring event instance by its ID and organization ID.

## Parameters

### instanceId

`string`

The ID of the recurring event instance to retrieve.

### organizationId

`string`

The ID of the organization to which the instance belongs.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md) \| `null`\>

- A promise that resolves to the resolved recurring event instance, or null if not found.
