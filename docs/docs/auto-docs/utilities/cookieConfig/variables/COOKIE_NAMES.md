[API Docs](/)

***

# Variable: COOKIE\_NAMES

> `const` **COOKIE\_NAMES**: `object`

Defined in: src/utilities/cookieConfig.ts:7

Cookie names used for authentication tokens.
These are centralized here to ensure consistency across the codebase.

## Type Declaration

### ACCESS\_TOKEN

> `readonly` **ACCESS\_TOKEN**: `"talawa_access_token"` = `"talawa_access_token"`

HTTP-Only cookie containing the short-lived JWT access token.

### REFRESH\_TOKEN

> `readonly` **REFRESH\_TOKEN**: `"talawa_refresh_token"` = `"talawa_refresh_token"`

HTTP-Only cookie containing the refresh token for obtaining new access tokens.
