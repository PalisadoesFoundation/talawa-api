[**talawa-api**](../../../README.md)

***

# Interface: CookieConfigOptions

Defined in: [src/utilities/cookieConfig.ts:23](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/cookieConfig.ts#L23)

Default cookie options with security best practices.
These options ensure cookies are protected from XSS attacks.

## Properties

### domain?

> `optional` **domain**: `string`

Defined in: [src/utilities/cookieConfig.ts:32](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/cookieConfig.ts#L32)

Optional domain for the cookie (for cross-subdomain authentication).

***

### isSecure

> **isSecure**: `boolean`

Defined in: [src/utilities/cookieConfig.ts:27](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/cookieConfig.ts#L27)

Whether the application is running in a secure (HTTPS) environment.

***

### path?

> `optional` **path**: `string`

Defined in: [src/utilities/cookieConfig.ts:37](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/utilities/cookieConfig.ts#L37)

Cookie path.
