[**talawa-api**](../../../../README.md)

***

# Class: UnauthorizedError

Represents an unauthorized error. It extends the ApplicationError class
and is used to handle situations where access to a resource is unauthorized.

## Extends

- [`ApplicationError`](../../applicationError/classes/ApplicationError.md)

## Constructors

### new UnauthorizedError()

> **new UnauthorizedError**(`message`, `code`, `param`, `metadata`): [`UnauthorizedError`](UnauthorizedError.md)

Creates an instance of UnauthorizedError.

#### Parameters

##### message

`string` = `"UnauthorizedError"`

The error message. Defaults to "UnauthorizedError".

##### code

`string` = `null`

The error code. Can be null. Defaults to null.

##### param

`string` = `null`

The parameter related to the error. Can be null. Defaults to null.

##### metadata

`Record`\<`any`, `any`\> = `{}`

Additional metadata related to the error. Defaults to an empty object.

#### Returns

[`UnauthorizedError`](UnauthorizedError.md)

#### Overrides

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`constructor`](../../applicationError/classes/ApplicationError.md#constructors)

#### Defined in

[src/libraries/errors/unauthorizedError.ts:15](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/libraries/errors/unauthorizedError.ts#L15)

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
