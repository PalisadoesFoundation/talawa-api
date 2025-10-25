[Admin Docs](/)

***

# Function: getRecurringEventInstanceById()

> **getRecurringEventInstanceById**(`instanceId`, `organizationId`, `drizzleClient`, `logger`): `Promise`\<`null` \| [`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)\>

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:149](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L149)

Retrieves a single resolved recurring event instance by its ID and organization ID.

## Parameters

### instanceId

`string`

The ID of the recurring event instance to retrieve.

### organizationId

`string`

The ID of the organization to which the instance belongs.

### drizzleClient

`NodePgDatabase`\<``drizzle/schema``\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`null` \| [`ResolvedRecurringEventInstance`](../../../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)\>

A promise that resolves to the resolved recurring event event instance, or null if not found.
