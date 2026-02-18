[API Docs](/)

***

# Function: getStandaloneEventsByIds()

> **getStandaloneEventsByIds**(`eventIds`, `drizzleClient`, `logger`, `options?`): `Promise`\<`object` & `object`[]\>

Defined in: [src/graphql/types/Query/eventQueries/standaloneEventQueries.ts:127](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/standaloneEventQueries.ts#L127)

Retrieves standalone events (and optionally recurring templates) by a list of specific IDs.
This function is designed for the `eventsByIds` query. By default, only standalone events
(not recurring templates or instances) are returned. When `options.includeTemplates` is true,
recurring event templates matching the IDs are also included.

## Parameters

### eventIds

`string`[]

An array of event IDs to retrieve.

### drizzleClient

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

### options?

Optional. `includeTemplates`: when true, includes recurring event templates in the result; default false.

#### includeTemplates?

`boolean`

## Returns

`Promise`\<`object` & `object`[]\>

- A promise that resolves to an array of the requested event objects, including their attachments.
