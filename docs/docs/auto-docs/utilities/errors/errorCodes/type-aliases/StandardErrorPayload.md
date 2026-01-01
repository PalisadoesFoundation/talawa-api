[API Docs](/)

***

# Type Alias: StandardErrorPayload

> **StandardErrorPayload** = `object`

Defined in: [src/utilities/errors/errorCodes.ts:122](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L122)

Standard error payload structure returned by REST endpoints.

This type defines the consistent error response format used across
all REST API endpoints in the Talawa API.

## Example

```json
{
  "error": {
    "code": "not_found",
    "message": "User not found",
    "details": { "userId": "123" },
    "correlationId": "req-abc123"
  }
}
```

## Properties

### error

> **error**: `object`

Defined in: [src/utilities/errors/errorCodes.ts:124](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L124)

Error container object

#### code

> **code**: [`ErrorCode`](../enumerations/ErrorCode.md)

Standardized error code from ErrorCode enum

#### correlationId?

> `optional` **correlationId**: `string`

Request correlation ID for tracing

#### details?

> `optional` **details**: `unknown`

Optional additional error context and details

#### message

> **message**: `string`

Human-readable error message
