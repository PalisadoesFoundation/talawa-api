[API Docs](/)

***

# Function: extendGenerationWindow()

> **extendGenerationWindow**(`organizationId`, `additionalMonths`, `drizzleClient`, `logger`): `Promise`\<`Date`\>

Defined in: [src/services/eventGeneration/windowManager.ts:130](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/windowManager.ts#L130)

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

`NodePgDatabase`\<[API Docs](/)\>

The Drizzle ORM client for database access.

### logger

`FastifyBaseLogger`

The logger for logging debug and error messages.

## Returns

`Promise`\<`Date`\>

- A promise that resolves to the new end date of the Generation window.
