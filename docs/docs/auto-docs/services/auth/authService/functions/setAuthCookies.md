[API Docs](/)

***

# Function: setAuthCookies()

> **setAuthCookies**(`reply`, `tokens`, `cookieOptions?`): `void`

Defined in: [src/services/auth/authService.ts:209](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/authService.ts#L209)

Sets HTTP-only auth cookies on the reply. When cookieOptions is omitted, builds options from process.env.

## Parameters

### reply

`FastifyReply`

### tokens

[`SetAuthCookiesTokens`](../interfaces/SetAuthCookiesTokens.md)

### cookieOptions?

[`CookieConfigOptions`](../../../../utilities/cookieConfig/interfaces/CookieConfigOptions.md)

## Returns

`void`
