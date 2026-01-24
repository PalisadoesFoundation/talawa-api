[API Docs](/)

***

# Function: getAccessTokenCookieOptions()

> **getAccessTokenCookieOptions**(`options`, `maxAgeMs`): `CookieSerializeOptions`

Defined in: src/utilities/cookieConfig.ts:48

Generates cookie options for access tokens.
Access tokens are short-lived and used for API authentication.

## Parameters

### options

[`CookieConfigOptions`](../interfaces/CookieConfigOptions.md)

Configuration options for the cookie

### maxAgeMs

`number`

Maximum age of the cookie in milliseconds (should match JWT expiry)

## Returns

`CookieSerializeOptions`

- Cookie serialization options
