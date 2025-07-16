[Admin Docs](/)

***

# Function: getStandaloneEventsByIds()

> **getStandaloneEventsByIds**(`eventIds`, `drizzleClient`, `logger`): `Promise`\<`object` & `object`[]\>

Defined in: [src/graphql/types/Query/eventQueries/standaloneEventQueries.ts:102](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/graphql/types/Query/eventQueries/standaloneEventQueries.ts#L102)

Gets standalone events by specific IDs.
Used for eventsByIds query when IDs represent standalone events.

## Parameters

### eventIds

`string`[]

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`object` & `object`[]\>
