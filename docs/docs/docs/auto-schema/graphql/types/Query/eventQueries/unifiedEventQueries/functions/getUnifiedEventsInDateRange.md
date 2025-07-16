[Admin Docs](/)

***

# Function: getUnifiedEventsInDateRange()

> **getUnifiedEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:41](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L41)

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
