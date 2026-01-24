[**talawa-api**](../../../../../README.md)

***

# Class: InvalidAuthorizationCodeError

Defined in: [src/utilities/auth/oauth/errors.ts:19](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/errors.ts#L19)

Error thrown when authorization code is invalid

## Extends

- [`OAuthError`](OAuthError.md)

## Constructors

### Constructor

> **new InvalidAuthorizationCodeError**(`message`): `InvalidAuthorizationCodeError`

Defined in: [src/utilities/auth/oauth/errors.ts:20](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/errors.ts#L20)

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

Defined in: [src/utilities/auth/oauth/errors.ts:7](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/errors.ts#L7)

#### Inherited from

[`OAuthError`](OAuthError.md).[`code`](OAuthError.md#code)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [src/utilities/auth/oauth/errors.ts:8](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/utilities/auth/oauth/errors.ts#L8)

#### Inherited from

[`OAuthError`](OAuthError.md).[`statusCode`](OAuthError.md#statuscode)
