[**talawa-api**](../../../../README.md)

***

# Class: NotFoundError

Represents a "Not Found" error. It extends the ApplicationError class
and is used to handle situations where a requested resource is not found.

## Extends

- [`ApplicationError`](../../applicationError/classes/ApplicationError.md)

## Constructors

### new NotFoundError()

> **new NotFoundError**(`message`, `code`, `param`, `metadata`): [`NotFoundError`](NotFoundError.md)

Creates an instance of NotFoundError.

#### Parameters

##### message

`string` = `"Not Found"`

The error message. Defaults to "Not Found".

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

[`NotFoundError`](NotFoundError.md)

#### Overrides

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`constructor`](../../applicationError/classes/ApplicationError.md#constructors)

#### Defined in

[src/libraries/errors/notFoundError.ts:18](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/libraries/errors/notFoundError.ts#L18)

## Properties

### code

> **code**: `string`

#### Defined in

[src/libraries/errors/notFoundError.ts:8](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/libraries/errors/notFoundError.ts#L8)

***

### errors

> **errors**: [`InterfaceError`](../../applicationError/interfaces/InterfaceError.md)[]

An array of errors conforming to the InterfaceError interface

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`errors`](../../applicationError/classes/ApplicationError.md#errors-1)

#### Defined in

[src/libraries/errors/applicationError.ts:21](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/libraries/errors/applicationError.ts#L21)

***

### httpCode

> **httpCode**: `any`

The HTTP status code associated with the error

#### Inherited from

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`httpCode`](../../applicationError/classes/ApplicationError.md#httpcode-1)

#### Defined in

[src/libraries/errors/applicationError.ts:23](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/libraries/errors/applicationError.ts#L23)

***

### param

> **param**: `string`

#### Defined in

[src/libraries/errors/notFoundError.ts:9](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/libraries/errors/notFoundError.ts#L9)
