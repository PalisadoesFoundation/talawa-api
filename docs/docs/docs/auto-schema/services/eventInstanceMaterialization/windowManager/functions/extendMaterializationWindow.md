[Admin Docs](/)

***

# Function: extendMaterializationWindow()

> **extendMaterializationWindow**(`organizationId`, `additionalMonths`, `drizzleClient`, `logger`): `Promise`\<`Date`\>

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:85](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/services/eventInstanceMaterialization/windowManager.ts#L85)

Extends materialization window forward by specified months

## Parameters

### organizationId

`string`

### additionalMonths

`number`

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`Date`\>
