[Admin Docs](/)

***

# Function: extendMaterializationWindow()

> **extendMaterializationWindow**(`organizationId`, `additionalMonths`, `drizzleClient`, `logger`): `Promise`\<`Date`\>

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:101](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/services/eventInstanceMaterialization/windowManager.ts#L101)

Extends the materialization window for an organization by a specified number of months,
allowing for the generation of future event instances.

## Parameters

### organizationId

`string`

The ID of the organization whose window is to be extended.

### additionalMonths

`number`

The number of months to extend the window by.

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`Date`\>

A promise that resolves to the new end date of the materialization window.
