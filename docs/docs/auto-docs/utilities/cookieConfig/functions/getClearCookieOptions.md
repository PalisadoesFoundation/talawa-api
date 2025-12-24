[API Docs](/)

***

# Function: getClearCookieOptions()

> **getClearCookieOptions**(`options`): `CookieSerializeOptions`

Defined in: src/utilities/cookieConfig.ts:91

Generates cookie options for clearing/removing cookies.
Used during logout to invalidate authentication cookies.

## Parameters

### options

[`CookieConfigOptions`](../interfaces/CookieConfigOptions.md)

Configuration options for the cookie

## Returns

`CookieSerializeOptions`

Cookie serialization options that will clear the cookie
