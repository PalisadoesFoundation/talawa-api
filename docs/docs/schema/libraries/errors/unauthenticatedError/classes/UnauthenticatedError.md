[**talawa-api**](../../../../README.md)

***

# Class: UnauthenticatedError

This class represents an error indicating an unauthenticated request.
It extends the ApplicationError class to handle and format the error information.

## Extends

- [`ApplicationError`](../../applicationError/classes/ApplicationError.md)

## Constructors

### new UnauthenticatedError()

> **new UnauthenticatedError**(`message`, `code`, `param`, `metadata`): [`UnauthenticatedError`](UnauthenticatedError.md)

Creates an instance of UnauthenticatedError.

#### Parameters

##### message

`string` = `"UnauthenticatedError"`

The error message (default is "UnauthenticatedError").

##### code

`string` = `null`

Optional error code (default is null).

##### param

`string` = `null`

Optional parameter associated with the error (default is null).

##### metadata

`Record`\<`any`, `any`\> = `{}`

Optional additional metadata associated with the error (default is an empty object).

#### Returns

[`UnauthenticatedError`](UnauthenticatedError.md)

#### Overrides

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`constructor`](../../applicationError/classes/ApplicationError.md#constructors)

#### Defined in

[src/libraries/errors/unauthenticatedError.ts:16](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/libraries/errors/unauthenticatedError.ts#L16)

## Properties

### errors

> **errors**: [`InterfaceError`](../../applicationError/interfaces/InterfaceError.md)[]

An array of errors conforming to the InterfaceError interface

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`errors`](../../applicationError/classes/ApplicationError.md#errors-1)

#### Defined in

[src/libraries/errors/applicationError.ts:21](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/libraries/errors/applicationError.ts#L21)

***

### httpCode

> **httpCode**: `any`

The HTTP status code associated with the error

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`httpCode`](../../applicationError/classes/ApplicationError.md#httpcode-1)

#### Defined in

[src/libraries/errors/applicationError.ts:23](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/libraries/errors/applicationError.ts#L23)
