[API Docs](/)

***

# Class: TokenExchangeError

Defined in: src/utilities/auth/oauth/errors.ts:30

Error thrown when token exchange fails

## Extends

- [`OAuthError`](OAuthError.md)

## Constructors

### Constructor

> **new TokenExchangeError**(`message`, `details?`): `TokenExchangeError`

Defined in: src/utilities/auth/oauth/errors.ts:31

#### Parameters

##### message

`string` = `"Token exchange failed"`

##### details?

`string`

#### Returns

`TokenExchangeError`

#### Overrides

[`OAuthError`](OAuthError.md).[`constructor`](OAuthError.md#constructor)

## Properties

### code

> **code**: `string`

Defined in: src/utilities/auth/oauth/errors.ts:7

#### Inherited from

[`OAuthError`](OAuthError.md).[`code`](OAuthError.md#code)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: src/utilities/auth/oauth/errors.ts:8

#### Inherited from

[`OAuthError`](OAuthError.md).[`statusCode`](OAuthError.md#statuscode)
