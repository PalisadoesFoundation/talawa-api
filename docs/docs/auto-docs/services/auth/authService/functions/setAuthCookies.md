[API Docs](/)

***

# Function: setAuthCookies()

> **setAuthCookies**(`reply`, `tokens`, `cookieOptions?`): `void`

Defined in: [src/services/auth/authService.ts:261](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/authService.ts#L261)

Sets HTTP-only auth cookies on the reply.

## Parameters

### reply

`FastifyReply`

Fastify reply instance to set cookies on.

### tokens

[`SetAuthCookiesTokens`](../interfaces/SetAuthCookiesTokens.md)

SetAuthCookiesTokens; may contain access and/or refresh token strings; only present keys are set.

### cookieOptions?

[`CookieConfigOptions`](../../../../utilities/cookieConfig/interfaces/CookieConfigOptions.md)

Optional CookieConfigOptions (domain, isSecure, path); when omitted, built from process.env.

## Returns

`void`

void
