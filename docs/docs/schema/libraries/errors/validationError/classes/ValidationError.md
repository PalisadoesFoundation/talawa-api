[**talawa-api**](../../../../README.md)

***

# Class: ValidationError

This class represents an error indicating validation errors.
It extends the ApplicationError class to handle and format the error information.

## Extends

- [`ApplicationError`](../../applicationError/classes/ApplicationError.md)

## Constructors

### new ValidationError()

> **new ValidationError**(`errors`, `message`): [`ValidationError`](ValidationError.md)

Creates an instance of ValidationError.

#### Parameters

##### errors

[`InterfaceError`](../../applicationError/interfaces/InterfaceError.md)[] = `[]`

An array of errors conforming to the InterfaceError interface (default is an empty array).

##### message

`string` = `"Validation error"`

The error message (default is "Validation error").

#### Returns

[`ValidationError`](ValidationError.md)

#### Overrides

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`constructor`](../../applicationError/classes/ApplicationError.md#constructors)

#### Defined in

[src/libraries/errors/validationError.ts:15](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/validationError.ts#L15)

## Properties

### errors

> **errors**: [`InterfaceError`](../../applicationError/interfaces/InterfaceError.md)[]

An array of errors conforming to the InterfaceError interface

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`errors`](../../applicationError/classes/ApplicationError.md#errors-1)

#### Defined in

[src/libraries/errors/applicationError.ts:21](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/applicationError.ts#L21)

***

### httpCode

> **httpCode**: `any`

The HTTP status code associated with the error

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`httpCode`](../../applicationError/classes/ApplicationError.md#httpcode-1)

#### Defined in

[src/libraries/errors/applicationError.ts:23](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/applicationError.ts#L23)
