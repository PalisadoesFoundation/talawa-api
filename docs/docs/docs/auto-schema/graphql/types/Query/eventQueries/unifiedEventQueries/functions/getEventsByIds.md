[Admin Docs](/)

***

# Function: getEventsByIds()

> **getEventsByIds**(`eventIds`, `drizzleClient`, `logger`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:194](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L194)

Retrieves events by their specific IDs, supporting both standalone events and
materialized instances in a single, unified query. This function is used by the
`eventsByIds` GraphQL query to fetch a mixed list of event types.

## Parameters

### eventIds

`string`[]

An array of event IDs to retrieve.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

A promise that resolves to an array of the requested event objects,
         unified into a common format.
