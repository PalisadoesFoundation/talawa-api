[**talawa-api**](../../../../../../README.md)

***

# Function: getUnifiedEventsInDateRange()

> **getUnifiedEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:228](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L228)

Retrieves a unified list of events, including both standalone events and generated
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

- A promise that resolves to a sorted array of unified event objects.
