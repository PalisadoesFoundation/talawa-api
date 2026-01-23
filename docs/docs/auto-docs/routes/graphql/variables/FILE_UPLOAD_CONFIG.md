[API Docs](/)

***

# Variable: FILE\_UPLOAD\_CONFIG

> `const` **FILE\_UPLOAD\_CONFIG**: `object`

Defined in: [src/routes/graphql.ts:248](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/routes/graphql.ts#L248)

File upload configuration for GraphQL multipart requests.
These limits are enforced by mercurius-upload and are exported for use in tests.

## Type Declaration

### maxFieldSize

> `readonly` **maxFieldSize**: `1048576` = `1048576`

Maximum allowed non-file multipart form field size in bytes.
This is the size of the actual graphql document excluding file uploads.
1024 * 1024 = 1MB

### maxFiles

> `readonly` **maxFiles**: `20` = `20`

Maximum allowed number of files in a single graphql operation.

### maxFileSize

> `readonly` **maxFileSize**: `10485760` = `10485760`

Maximum allowed file size in bytes.
1024 * 1024 * 10 = 10MB
