[API Docs](/)

***

# Interface: CookieConfigOptions

Defined in: [src/utilities/cookieConfig.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/cookieConfig.ts#L23)

Default cookie options with security best practices.
These options ensure cookies are protected from XSS attacks.

## Properties

### domain?

> `optional` **domain**: `string`

Defined in: [src/utilities/cookieConfig.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/cookieConfig.ts#L32)

Optional domain for the cookie (for cross-subdomain authentication).

***

### isSecure

> **isSecure**: `boolean`

Defined in: [src/utilities/cookieConfig.ts:27](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/cookieConfig.ts#L27)

Whether the application is running in a secure (HTTPS) environment.

***

### path?

> `optional` **path**: `string`

Defined in: [src/utilities/cookieConfig.ts:37](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/cookieConfig.ts#L37)

Cookie path.
