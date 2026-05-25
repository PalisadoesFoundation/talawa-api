[API Docs](/)

***

# Class: ProfileFetchError

Defined in: [src/utilities/auth/oauth/errors.ts:45](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L45)

Error thrown when profile fetch fails

## Extends

- [`OAuthError`](OAuthError.md)

## Constructors

### Constructor

> **new ProfileFetchError**(`message`): `ProfileFetchError`

Defined in: [src/utilities/auth/oauth/errors.ts:46](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L46)

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

Defined in: [src/utilities/auth/oauth/errors.ts:7](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L7)

#### Inherited from

[`OAuthError`](OAuthError.md).[`code`](OAuthError.md#code)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [src/utilities/auth/oauth/errors.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L8)

#### Inherited from

[`OAuthError`](OAuthError.md).[`statusCode`](OAuthError.md#statuscode)
