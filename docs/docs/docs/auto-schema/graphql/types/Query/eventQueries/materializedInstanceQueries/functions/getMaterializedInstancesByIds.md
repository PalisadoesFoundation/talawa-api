[Admin Docs](/)

***

# Function: getMaterializedInstancesByIds()

> **getMaterializedInstancesByIds**(`instanceIds`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts:96](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts#L96)

Retrieves multiple resolved materialized instances by their specific IDs.
This function performs a batch operation to efficiently fetch and resolve instances,
avoiding the N+1 query problem.

## Parameters

### instanceIds

`string`[]

An array of materialized instance IDs to retrieve.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]\>

A promise that resolves to an array of the requested resolved materialized event instances.
