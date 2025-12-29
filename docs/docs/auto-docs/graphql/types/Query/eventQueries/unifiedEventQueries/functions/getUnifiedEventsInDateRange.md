[API Docs](/)

***

# Function: getUnifiedEventsInDateRange()

> **getUnifiedEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:228](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L228)

Retrieves a unified list of events, including both standalone events and generated
instances of recurring events, within a specified date range. This is the primary function
used by the `organization.events` GraphQL resolver.

## Parameters

### input

[`GetUnifiedEventsInput`](../interfaces/GetUnifiedEventsInput.md)

The input object containing organizationId, date range, and optional filters.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

- A promise that resolves to a sorted array of unified event objects.
