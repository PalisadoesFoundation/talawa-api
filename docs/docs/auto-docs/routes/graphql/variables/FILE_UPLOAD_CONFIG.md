[**talawa-api**](../../../README.md)

***

# Variable: FILE\_UPLOAD\_CONFIG

> `const` **FILE\_UPLOAD\_CONFIG**: `object`

Defined in: [src/routes/graphql.ts:171](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/routes/graphql.ts#L171)

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
