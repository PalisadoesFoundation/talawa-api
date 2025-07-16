[Admin Docs](/)

***

# Function: getEventsByIds()

> **getEventsByIds**(`eventIds`, `drizzleClient`, `logger`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:178](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L178)

Gets events by their IDs, supporting both standalone events and materialized instances.
This is used by the eventsByIds GraphQL query.

## Parameters

### eventIds

`string`[]

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>
