[Admin Docs](/)

***

# Function: getUnifiedEventsInDateRange()

> **getUnifiedEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:52](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L52)

Retrieves a unified list of events, including both standalone events and materialized
instances of recurring events, within a specified date range. This is the primary function
used by the `organization.events` GraphQL resolver.

## Parameters

### input

[`GetUnifiedEventsInput`](../interfaces/GetUnifiedEventsInput.md)

The input object containing organizationId, date range, and optional filters.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

A promise that resolves to a sorted array of unified event objects.
