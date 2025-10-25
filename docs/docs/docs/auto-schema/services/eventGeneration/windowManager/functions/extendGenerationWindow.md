[Admin Docs](/)

***

# Function: extendGenerationWindow()

> **extendGenerationWindow**(`organizationId`, `additionalMonths`, `drizzleClient`, `logger`): `Promise`\<`Date`\>

Defined in: [src/services/eventGeneration/windowManager.ts:101](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/services/eventGeneration/windowManager.ts#L101)

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

`NodePgDatabase`\<``drizzle/schema``\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`Date`\>

A promise that resolves to the new end date of the Generation window.
