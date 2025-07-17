[Admin Docs](/)

***

# Function: getStandaloneEventsInDateRange()

> **getStandaloneEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<`object` & `object`[]\>

Defined in: [src/graphql/types/Query/eventQueries/standaloneEventQueries.ts:33](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Query/eventQueries/standaloneEventQueries.ts#L33)

Retrieves standalone (non-recurring) events for a given organization within a specified date range.
This function filters out recurring templates and materialized instances, focusing only on regular,
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
