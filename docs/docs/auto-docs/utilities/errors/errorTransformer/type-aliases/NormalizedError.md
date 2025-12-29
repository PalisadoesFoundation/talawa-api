[API Docs](/)

***

# Type Alias: NormalizedError

> **NormalizedError** = `object`

Defined in: [src/utilities/errors/errorTransformer.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L12)

Normalized error structure used internally by the error handling system.

This type represents the standardized format that all errors are transformed
into before being sent as responses.

## Properties

### code

> **code**: [`ErrorCode`](../../errorCodes/enumerations/ErrorCode.md)

Defined in: [src/utilities/errors/errorTransformer.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L14)

Standardized error code

***

### details?

> `optional` **details**: `unknown`

Defined in: [src/utilities/errors/errorTransformer.ts:20](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L20)

Optional additional error context

***

### message

> **message**: `string`

Defined in: [src/utilities/errors/errorTransformer.ts:16](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L16)

Human-readable error message

***

### statusCode

> **statusCode**: `number`

Defined in: [src/utilities/errors/errorTransformer.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L18)

HTTP status code
