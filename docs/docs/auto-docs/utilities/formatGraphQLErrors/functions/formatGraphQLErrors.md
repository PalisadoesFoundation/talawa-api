[API Docs](/)

***

# Function: formatGraphQLErrors()

> **formatGraphQLErrors**(`errors`, `correlationId`, `logger?`, `httpStatusCode?`): `object`

Defined in: [src/utilities/formatGraphQLErrors.ts:110](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/formatGraphQLErrors.ts#L110)

formats GraphQL errors, sanitizes extensions, determines status codes, and logs errors.

## Parameters

### errors

readonly `GraphQLError`[]

The list of GraphQL errors to format

### correlationId

`string`

The correlation ID for request tracing

### logger?

[`Logger`](../interfaces/Logger.md)

Optional logger for error logging

### httpStatusCode?

`number`

The actual HTTP status code to log (200 for HTTP, mapped code for subscriptions)

## Returns

`object`

Object containing formatted errors and the combined status code

### formatted

> **formatted**: [`FormattedGraphQLError`](../interfaces/FormattedGraphQLError.md)[]

### statusCode

> **statusCode**: `number`
