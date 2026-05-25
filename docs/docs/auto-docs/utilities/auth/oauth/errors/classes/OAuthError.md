[API Docs](/)

***

# Class: OAuthError

Defined in: [src/utilities/auth/oauth/errors.ts:4](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L4)

Base error class for OAuth-related errors

## Extends

- `Error`

## Extended by

- [`InvalidAuthorizationCodeError`](InvalidAuthorizationCodeError.md)
- [`TokenExchangeError`](TokenExchangeError.md)
- [`ProfileFetchError`](ProfileFetchError.md)

## Constructors

### Constructor

> **new OAuthError**(`message`, `code`, `statusCode?`): `OAuthError`

Defined in: [src/utilities/auth/oauth/errors.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L5)

#### Parameters

##### message

`string`

##### code

`string`

##### statusCode?

`number`

#### Returns

`OAuthError`

#### Overrides

`Error.constructor`

## Properties

### code

> **code**: `string`

Defined in: [src/utilities/auth/oauth/errors.ts:7](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L7)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [src/utilities/auth/oauth/errors.ts:8](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/auth/oauth/errors.ts#L8)
