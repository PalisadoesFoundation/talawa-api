[API Docs](/)

***

# Function: normalizeErrorCode()

> **normalizeErrorCode**(`rawCode?`): [`ErrorCode`](../../errors/errorCodes/enumerations/ErrorCode.md)

Defined in: [src/utilities/formatGraphQLErrors.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/formatGraphQLErrors.ts#L28)

Normalizes raw error codes to standard ErrorCode values.
Handles legacy error codes by mapping them to current standards.

## Parameters

### rawCode?

`string`

The raw error code string from the error

## Returns

[`ErrorCode`](../../errors/errorCodes/enumerations/ErrorCode.md)

The corresponding ErrorCode enum value
