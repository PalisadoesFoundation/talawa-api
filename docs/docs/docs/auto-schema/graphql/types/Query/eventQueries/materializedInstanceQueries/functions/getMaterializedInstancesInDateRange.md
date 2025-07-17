[Admin Docs](/)

***

# Function: getMaterializedInstancesInDateRange()

> **getMaterializedInstancesInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts:32](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/graphql/types/Query/eventQueries/materializedInstanceQueries.ts#L32)

Gets materialized instances for an organization within a date range.
Resolves each instance with inheritance from template + exceptions.

This demonstrates the exception table only approach:
1. Get materialized instances (just dates and metadata)
2. Get base templates (for inheritance)
3. Get exceptions (for overrides)
4. Resolve inheritance + exceptions at runtime

## Parameters

### input

[`GetMaterializedInstancesInput`](../interfaces/GetMaterializedInstancesInput.md)

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<[`ResolvedMaterializedEventInstance`](../../../../../../drizzle/tables/materializedEventInstances/type-aliases/ResolvedMaterializedEventInstance.md)[]\>
