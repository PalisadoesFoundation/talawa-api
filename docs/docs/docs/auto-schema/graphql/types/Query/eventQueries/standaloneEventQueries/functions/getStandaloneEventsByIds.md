[Admin Docs](/)

***

# Function: getStandaloneEventsByIds()

> **getStandaloneEventsByIds**(`eventIds`, `drizzleClient`, `logger`): `Promise`\<`object` & `object`[]\>

Defined in: [src/graphql/types/Query/eventQueries/standaloneEventQueries.ts:120](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Query/eventQueries/standaloneEventQueries.ts#L120)

Retrieves standalone events by a list of specific IDs.
This function is designed for the `eventsByIds` query, ensuring that only standalone events
(not recurring templates or instances) are returned.

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

`Promise`\<`object` & `object`[]\>

A promise that resolves to an array of the requested standalone event objects,
         including their attachments.
