[API Docs](/)

***

# Class: TalawaRestError

Defined in: [src/utilities/errors/TalawaRestError.ts:36](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L36)

Custom error class for REST API endpoints with standardized error codes and HTTP status mapping.

TalawaRestError provides a structured way to throw errors in REST routes that will be
automatically transformed by the global error handler into consistent error responses.

## Example

```ts
// Basic usage
throw new TalawaRestError({
  code: ErrorCode.NOT_FOUND,
  message: "User not found"
});

// With additional details
throw new TalawaRestError({
  code: ErrorCode.NOT_FOUND,
  message: "User not found",
  details: { userId: "123", requestedBy: "admin" }
});

// With custom status code override
throw new TalawaRestError({
  code: ErrorCode.NOT_FOUND,
  message: "Custom error",
  statusCodeOverride: 418
});
```

## Extends

- `Error`

## Constructors

### Constructor

> **new TalawaRestError**(`args`): `TalawaRestError`

Defined in: [src/utilities/errors/TalawaRestError.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L53)

Creates a new TalawaRestError instance.

#### Parameters

##### args

Error configuration object.
  - args.code: Standardized error code from ErrorCode enum
  - args.message: Human-readable error message
  - args.details: Optional additional error context and details
  - args.statusCodeOverride: Optional HTTP status code override

###### code

[`ErrorCode`](../../errorCodes/enumerations/ErrorCode.md)

###### details?

`unknown`

###### message

`string`

###### statusCodeOverride?

`number`

#### Returns

`TalawaRestError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: [`ErrorCode`](../../errorCodes/enumerations/ErrorCode.md)

Defined in: [src/utilities/errors/TalawaRestError.ts:38](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L38)

The standardized error code

***

### details?

> `readonly` `optional` **details**: `unknown`

Defined in: [src/utilities/errors/TalawaRestError.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L42)

Optional additional error context

***

### statusCode

> `readonly` **statusCode**: `number`

Defined in: [src/utilities/errors/TalawaRestError.ts:40](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L40)

HTTP status code for this error

## Methods

### toJSON()

> **toJSON**(`correlationId?`): [`StandardErrorPayload`](../../errorCodes/type-aliases/StandardErrorPayload.md)

Defined in: [src/utilities/errors/TalawaRestError.ts:95](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L95)

Converts the error to a standardized JSON response format.

This method is used by the global error handler to create consistent
error responses for REST endpoints.

#### Parameters

##### correlationId?

`string`

Optional request correlation ID for tracing

#### Returns

[`StandardErrorPayload`](../../errorCodes/type-aliases/StandardErrorPayload.md)

Standardized error payload object

#### Example

```ts
const error = new TalawaRestError({
  code: ErrorCode.NOT_FOUND,
  message: "User not found",
  details: { userId: "123" }
});

const payload = error.toJSON("req-abc123");
// Returns: {
//   error: {
//     code: "not_found",
//     message: "User not found",
//     details: { userId: "123" },
//     correlationId: "req-abc123"
//   }
// }
```
