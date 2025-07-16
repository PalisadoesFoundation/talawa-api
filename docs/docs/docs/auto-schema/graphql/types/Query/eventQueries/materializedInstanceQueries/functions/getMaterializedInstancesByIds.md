[Admin Docs](/)

***

# Function: getMaterializedInstancesByIds()

> **getMaterializedInstancesByIds**(`instanceIds`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts:84](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts#L84)

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
