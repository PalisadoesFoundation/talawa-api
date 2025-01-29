[**talawa-api**](../../../../README.md)

***

# Class: InvalidFileTypeError

This class represents an error indicating an invalid file type.
It extends the ApplicationError class to handle and format the error information.

## Extends

- [`ApplicationError`](../../applicationError/classes/ApplicationError.md)

## Constructors

### new InvalidFileTypeError()

> **new InvalidFileTypeError**(`message`, `code`, `param`, `metadata`): [`InvalidFileTypeError`](InvalidFileTypeError.md)

Creates an instance of InvalidFileTypeError.

#### Parameters

##### message

`string` = `"Invalid File Type"`

The error message (default is "Invalid File Type").

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

[`InvalidFileTypeError`](InvalidFileTypeError.md)

#### Overrides

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`constructor`](../../applicationError/classes/ApplicationError.md#constructors)

#### Defined in

[src/libraries/errors/invalidFileTypeError.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/invalidFileTypeError.ts#L16)

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
