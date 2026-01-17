[API Docs](/)

***

# Type Alias: NormalizedError

> **NormalizedError** = `object`

Defined in: [src/utilities/errors/errorTransformer.ts:13](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L13)

Normalized error structure used internally by the error handling system.

This type represents the standardized format that all errors are transformed
into before being sent as responses.

## Properties

### code

> **code**: [`ErrorCode`](../../errorCodes/enumerations/ErrorCode.md)

Defined in: [src/utilities/errors/errorTransformer.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L15)

Standardized error code

***

### details?

> `optional` **details**: `unknown`

Defined in: [src/utilities/errors/errorTransformer.ts:21](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L21)

Optional additional error context

***

### message

> **message**: `string`

Defined in: [src/utilities/errors/errorTransformer.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L17)

Human-readable error message

***

### statusCode

> **statusCode**: `number`

Defined in: [src/utilities/errors/errorTransformer.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L19)

HTTP status code
