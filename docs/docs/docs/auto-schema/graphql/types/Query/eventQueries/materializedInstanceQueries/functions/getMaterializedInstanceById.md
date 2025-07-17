[Admin Docs](/)

***

# Function: getMaterializedInstanceById()

> **getMaterializedInstanceById**(`instanceId`, `organizationId`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)\>

Defined in: [src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts:158](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts#L158)

Retrieves a single resolved materialized instance by its ID and organization ID.

## Parameters

### instanceId

`string`

The ID of the materialized instance to retrieve.

### organizationId

`string`

The ID of the organization to which the instance belongs.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)\>

A promise that resolves to the resolved materialized event instance, or null if not found.
