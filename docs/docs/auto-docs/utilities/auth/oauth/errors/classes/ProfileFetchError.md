[API Docs](/)

***

# Class: ProfileFetchError

Defined in: src/utilities/auth/oauth/errors.ts:45

Error thrown when profile fetch fails

## Extends

- [`OAuthError`](OAuthError.md)

## Constructors

### Constructor

> **new ProfileFetchError**(`message`): `ProfileFetchError`

Defined in: src/utilities/auth/oauth/errors.ts:46

#### Parameters

##### message

`string` = `"Failed to fetch user profile"`

#### Returns

`ProfileFetchError`

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
