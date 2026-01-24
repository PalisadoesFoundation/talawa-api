[**talawa-api**](../../../README.md)

***

# Function: getClearRefreshTokenCookieOptions()

> **getClearRefreshTokenCookieOptions**(`options`): `CookieSerializeOptions`

Defined in: src/utilities/cookieConfig.ts:113

Generates cookie options for clearing/removing refresh token cookies.
Used during logout to invalidate the refresh token cookie.
Uses sameSite: "lax" to match getRefreshTokenCookieOptions().

## Parameters

### options

[`CookieConfigOptions`](../interfaces/CookieConfigOptions.md)

Configuration options for the cookie

## Returns

`CookieSerializeOptions`

- Cookie serialization options that will clear the cookie
