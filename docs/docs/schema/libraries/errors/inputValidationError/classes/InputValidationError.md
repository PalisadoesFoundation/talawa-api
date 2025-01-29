[**talawa-api**](../../../../README.md)

***

# Class: InputValidationError

Represents an input validation error. It extends the ApplicationError class
and is used to handle errors related to input validation failures.

## Extends

- [`ApplicationError`](../../applicationError/classes/ApplicationError.md)

## Constructors

### new InputValidationError()

> **new InputValidationError**(`message`, `code`, `param`, `metadata`): [`InputValidationError`](InputValidationError.md)

Creates an instance of InputValidationError.

#### Parameters

##### message

`string` = `"InputValidationError"`

The error message. Defaults to "InputValidationError".

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

[`InputValidationError`](InputValidationError.md)

#### Overrides

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`constructor`](../../applicationError/classes/ApplicationError.md#constructors)

#### Defined in

[src/libraries/errors/inputValidationError.ts:15](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/libraries/errors/inputValidationError.ts#L15)

## Properties

### errors

> **errors**: [`InterfaceError`](../../applicationError/interfaces/InterfaceError.md)[]

An array of errors conforming to the InterfaceError interface

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`errors`](../../applicationError/classes/ApplicationError.md#errors-1)

#### Defined in

[src/libraries/errors/applicationError.ts:21](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/libraries/errors/applicationError.ts#L21)

***

### httpCode

> **httpCode**: `any`

The HTTP status code associated with the error

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`httpCode`](../../applicationError/classes/ApplicationError.md#httpcode-1)

#### Defined in

[src/libraries/errors/applicationError.ts:23](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/libraries/errors/applicationError.ts#L23)
