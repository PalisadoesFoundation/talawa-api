[API Docs](/)

***

# Enumeration: ErrorCode

Defined in: [src/utilities/errors/errorCodes.ts:24](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L24)

Standardized error codes used across REST and GraphQL endpoints.

This enum provides a unified taxonomy of error types that can occur in the Talawa API.
Each error code maps to an appropriate HTTP status code and provides consistent
error categorization across different API interfaces.

## Example

```ts
// Using in REST endpoint
throw new TalawaRestError({
  code: ErrorCode.NOT_FOUND,
  message: "User not found"
});

// Using in GraphQL resolver
throw new TalawaGraphQLError({
  extensions: {
    code: ErrorCode.UNAUTHENTICATED
  }
});
```

## Enumeration Members

### ALREADY\_EXISTS

> **ALREADY\_EXISTS**: `"already_exists"`

Defined in: [src/utilities/errors/errorCodes.ts:48](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L48)

Resource already exists and cannot be created again (HTTP 409)

***

### ARGUMENTS\_ASSOCIATED\_RESOURCES\_NOT\_FOUND

> **ARGUMENTS\_ASSOCIATED\_RESOURCES\_NOT\_FOUND**: `"arguments_associated_resources_not_found"`

Defined in: [src/utilities/errors/errorCodes.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L53)

Required associated resources were not found (HTTP 404)

***

### CONFLICT

> **CONFLICT**: `"conflict"`

Defined in: [src/utilities/errors/errorCodes.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L50)

Request conflicts with current resource state (HTTP 409)

***

### DATABASE\_ERROR

> **DATABASE\_ERROR**: `"database_error"`

Defined in: [src/utilities/errors/errorCodes.ts:63](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L63)

Database operation failed (HTTP 500)

***

### DEPRECATED

> **DEPRECATED**: `"deprecated"`

Defined in: [src/utilities/errors/errorCodes.ts:58](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L58)

Using deprecated API features (HTTP 400)

***

### EXTERNAL\_SERVICE\_ERROR

> **EXTERNAL\_SERVICE\_ERROR**: `"external_service_error"`

Defined in: [src/utilities/errors/errorCodes.ts:65](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L65)

External service is unavailable (HTTP 502)

***

### FORBIDDEN\_ACTION

> **FORBIDDEN\_ACTION**: `"forbidden_action"`

Defined in: [src/utilities/errors/errorCodes.ts:70](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L70)

Legacy error code for forbidden action (HTTP 403)

***

### FORBIDDEN\_ACTION\_ON\_ARGUMENTS\_ASSOCIATED\_RESOURCES

> **FORBIDDEN\_ACTION\_ON\_ARGUMENTS\_ASSOCIATED\_RESOURCES**: `"forbidden_action_on_arguments_associated_resources"`

Defined in: [src/utilities/errors/errorCodes.ts:68](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L68)

Action is failing because the user is not allowed to perform it on the resources associated to the provided arguments (HTTP 403)

***

### INSUFFICIENT\_PERMISSIONS

> **INSUFFICIENT\_PERMISSIONS**: `"insufficient_permissions"`

Defined in: [src/utilities/errors/errorCodes.ts:38](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L38)

User role is insufficient for the requested action (HTTP 403)

***

### INTERNAL\_SERVER\_ERROR

> **INTERNAL\_SERVER\_ERROR**: `"internal_server_error"`

Defined in: [src/utilities/errors/errorCodes.ts:61](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L61)

Unexpected server error occurred (HTTP 500)

***

### INVALID\_ARGUMENTS

> **INVALID\_ARGUMENTS**: `"invalid_arguments"`

Defined in: [src/utilities/errors/errorCodes.ts:41](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L41)

Request arguments failed validation (HTTP 400)

***

### INVALID\_CREDENTIALS

> **INVALID\_CREDENTIALS**: `"invalid_credentials"`

Defined in: [src/utilities/errors/errorCodes.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L33)

Invalid email or password provided during authentication (HTTP 401)

***

### INVALID\_INPUT

> **INVALID\_INPUT**: `"invalid_input"`

Defined in: [src/utilities/errors/errorCodes.ts:43](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L43)

Input data validation failed (HTTP 400)

***

### NOT\_FOUND

> **NOT\_FOUND**: `"not_found"`

Defined in: [src/utilities/errors/errorCodes.ts:46](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L46)

Requested resource does not exist (HTTP 404)

***

### RATE\_LIMIT\_EXCEEDED

> **RATE\_LIMIT\_EXCEEDED**: `"rate_limit_exceeded"`

Defined in: [src/utilities/errors/errorCodes.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L56)

Too many requests from client (HTTP 429)

***

### TOKEN\_EXPIRED

> **TOKEN\_EXPIRED**: `"token_expired"`

Defined in: [src/utilities/errors/errorCodes.ts:28](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L28)

JWT token has expired and needs to be refreshed (HTTP 401)

***

### TOKEN\_INVALID

> **TOKEN\_INVALID**: `"token_invalid"`

Defined in: [src/utilities/errors/errorCodes.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L30)

JWT token is malformed or invalid (HTTP 401)

***

### UNAUTHENTICATED

> **UNAUTHENTICATED**: `"unauthenticated"`

Defined in: [src/utilities/errors/errorCodes.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L26)

User must be authenticated to access this resource (HTTP 401)

***

### UNAUTHORIZED

> **UNAUTHORIZED**: `"unauthorized"`

Defined in: [src/utilities/errors/errorCodes.ts:36](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L36)

User lacks permission to perform this action (HTTP 403)

***

### UNAUTHORIZED\_ACTION\_ON\_ARGUMENTS\_ASSOCIATED\_RESOURCES

> **UNAUTHORIZED\_ACTION\_ON\_ARGUMENTS\_ASSOCIATED\_RESOURCES**: `"unauthorized_action_on_arguments_associated_resources"`

Defined in: [src/utilities/errors/errorCodes.ts:74](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L74)

Legacy error code for unauthorized action on associated resources (HTTP 403)

***

### UNEXPECTED

> **UNEXPECTED**: `"unexpected"`

Defined in: [src/utilities/errors/errorCodes.ts:72](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/errorCodes.ts#L72)

Legacy error code for unexpected server error (HTTP 500)
