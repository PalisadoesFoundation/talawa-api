[Admin Docs](/)

***

# Function: getMaterializedInstancesByIds()

> **getMaterializedInstancesByIds**(`instanceIds`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts:84](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts#L84)

Gets multiple resolved materialized instances by their IDs.
This is a batch operation to avoid N+1 queries.

## Parameters

### instanceIds

`string`[]

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]\>
