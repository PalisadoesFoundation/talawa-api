[API Docs](/)

***

# Function: clearAuthCookies()

> **clearAuthCookies**(`reply`, `cookieOptions?`): `void`

Defined in: [src/services/auth/authService.ts:239](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/auth/authService.ts#L239)

Clears auth cookies on the reply. Uses same path/domain as setAuthCookies when cookieOptions is omitted.

## Parameters

### reply

`FastifyReply`

### cookieOptions?

[`CookieConfigOptions`](../../../../utilities/cookieConfig/interfaces/CookieConfigOptions.md)

## Returns

`void`
