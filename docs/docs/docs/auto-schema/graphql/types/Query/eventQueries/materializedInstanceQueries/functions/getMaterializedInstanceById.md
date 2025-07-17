[Admin Docs](/)

***

# Function: getMaterializedInstanceById()

> **getMaterializedInstanceById**(`instanceId`, `organizationId`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)\>

Defined in: [src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts:140](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts#L140)

Gets a single resolved materialized instance by ID.

## Parameters

### instanceId

`string`

### organizationId

`string`

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)\>
