[Admin Docs](/)

***

# Function: extendMaterializationWindow()

> **extendMaterializationWindow**(`organizationId`, `additionalMonths`, `drizzleClient`, `logger`): `Promise`\<`Date`\>

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:85](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/services/eventInstanceMaterialization/windowManager.ts#L85)

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
