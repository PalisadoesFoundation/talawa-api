[API Docs](/)

***

# Type Alias: TalawaGraphQLFormattedError

> **TalawaGraphQLFormattedError** = `GraphQLFormattedError` & `object`

Defined in: [src/utilities/TalawaGraphQLError.ts:409](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/TalawaGraphQLError.ts#L409)

Formatted error type returned by Talawa API's GraphQL implementation.

This type extends the standard GraphQLFormattedError with typed extensions
that include structured error metadata for consistent client-side error handling.

## Type Declaration

### extensions

> **extensions**: [`TalawaGraphQLErrorExtensions`](TalawaGraphQLErrorExtensions.md)

Typed error extensions with structured metadata

## Example

```json
{
  "message": "User not found",
  "path": ["user"],
  "extensions": {
    "code": "not_found",
    "details": { "userId": "123" },
    "correlationId": "req-abc123",
    "httpStatus": 404
  }
}
```
