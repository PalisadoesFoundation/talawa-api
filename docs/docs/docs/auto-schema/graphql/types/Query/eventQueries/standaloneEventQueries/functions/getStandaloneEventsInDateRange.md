[Admin Docs](/)

***

# Function: getStandaloneEventsInDateRange()

> **getStandaloneEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<`object` & `object`[]\>

Defined in: [src/graphql/types/Query/eventQueries/standaloneEventQueries.ts:33](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/types/Query/eventQueries/standaloneEventQueries.ts#L33)

Retrieves standalone (non-recurring) events for a given organization within a specified date range.
This function filters out recurring templates and generated instances, focusing only on regular,
single-occurrence events that overlap with the provided time window.

## Parameters

### input

[`GetStandaloneEventsInput`](../interfaces/GetStandaloneEventsInput.md)

The input object containing organizationId, date range, and optional filters.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`object` & `object`[]\>

A promise that resolves to an array of standalone event objects, including their attachments.
