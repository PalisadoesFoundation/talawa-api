[API Docs](/)

***

# Class: InvalidAuthorizationCodeError

Defined in: src/utilities/auth/oauth/errors.ts:19

Error thrown when authorization code is invalid

## Extends

- [`OAuthError`](OAuthError.md)

## Constructors

### Constructor

> **new InvalidAuthorizationCodeError**(`message`): `InvalidAuthorizationCodeError`

Defined in: src/utilities/auth/oauth/errors.ts:20

#### Parameters

##### message

`string` = `"Invalid authorization code"`

#### Returns

`InvalidAuthorizationCodeError`

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
