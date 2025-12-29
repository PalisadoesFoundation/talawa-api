[API Docs](/)

***

# Variable: objects

> `const` **objects**: `FastifyPluginAsyncTypebox`

Defined in: [src/routes/objects.ts:36](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/objects.ts#L36)

Fastify route plugin for serving objects from MinIO storage.

This plugin provides a REST endpoint `/objects/:name` that allows clients to fetch
objects from the MinIO server. It demonstrates the use of structured error handling
with TalawaRestError for consistent error responses.

Features:
- Validates object name parameters (1-36 characters)
- Handles MinIO S3 errors with appropriate error codes
- Sets proper content headers for file downloads
- Uses structured error handling for consistent responses

## Example

```ts
// GET /objects/my-file.pdf
// Success: Returns file stream with proper headers
// Error: Returns structured error response
{
  "error": {
    "code": "not_found",
    "message": "No object found with the name \"my-file.pdf\".",
    "details": { "name": "my-file.pdf" },
    "correlationId": "req-123"
  }
}
```
