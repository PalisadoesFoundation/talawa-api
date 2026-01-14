[**talawa-api**](../../../../README.md)

***

# Function: extendGenerationWindow()

> **extendGenerationWindow**(`organizationId`, `additionalMonths`, `drizzleClient`, `logger`): `Promise`\<`Date`\>

Defined in: [src/services/eventGeneration/windowManager.ts:101](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/services/eventGeneration/windowManager.ts#L101)

Extends the Generation window for an organization by a specified number of months,
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

- A promise that resolves to the new end date of the Generation window.
