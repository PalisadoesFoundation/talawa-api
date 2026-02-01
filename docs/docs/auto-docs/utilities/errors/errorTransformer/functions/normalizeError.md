[API Docs](/)

***

# Function: normalizeError()

> **normalizeError**(`err`): [`NormalizedError`](../type-aliases/NormalizedError.md)

Defined in: [src/utilities/errors/errorTransformer.ts:57](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorTransformer.ts#L57)

Transforms various error types into a standardized NormalizedError format.

This function handles different error types that can occur in the application
and converts them into a consistent format for error responses. It supports:
- TalawaRestError (already normalized)
- Fastify validation errors
- Zod validation errors
- Generic Error objects
- Unknown error types

## Parameters

### err

`unknown`

The error to normalize (can be any type)

## Returns

[`NormalizedError`](../type-aliases/NormalizedError.md)

Normalized error with consistent structure

## Example

```ts
// TalawaRestError (already normalized)
const talawaError = new TalawaRestError({
  code: ErrorCode.NOT_FOUND,
  message: "User not found"
});
const normalized1 = normalizeError(talawaError);

const genericError = new Error("Something went wrong");
const normalized2 = normalizeError(genericError);
// Returns: { code: "internal_server_error", message: "Internal Server Error", statusCode: 500 }

// Zod validation error
const zodError = new ZodError([...]);
const normalized3 = normalizeError(zodError);
// Returns: { code: "invalid_arguments", message: "Invalid input", statusCode: 400, details: {...} }
```
