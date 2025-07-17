[Admin Docs](/)

***

# Function: getUnifiedEventsInDateRange()

> **getUnifiedEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:41](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L41)

Gets both standalone events and materialized instances in a unified response.
This is the main function used by organization.events GraphQL resolver.

## Parameters

### input

[`GetUnifiedEventsInput`](../interfaces/GetUnifiedEventsInput.md)

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>
