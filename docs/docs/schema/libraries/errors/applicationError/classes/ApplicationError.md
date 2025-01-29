[Admin Docs](/)

***

# Class: ApplicationError

This class is responsible for handling application errors.
It extends the built-in Error class to include additional properties and methods.

## Extends

- `Error`

## Extended by

- [`ConflictError`](../../conflictError/classes/ConflictError.md)
- [`ImageSizeLimitExceeded`](../../ImageSizeLimitExceeded/classes/ImageSizeLimitExceeded.md)
- [`InputValidationError`](../../inputValidationError/classes/InputValidationError.md)
- [`InternalServerError`](../../internalServerError/classes/InternalServerError.md)
- [`InvalidFileTypeError`](../../invalidFileTypeError/classes/InvalidFileTypeError.md)
- [`NotFoundError`](../../notFoundError/classes/NotFoundError.md)
- [`UnauthenticatedError`](../../unauthenticatedError/classes/UnauthenticatedError.md)
- [`UnauthorizedError`](../../unauthorizedError/classes/UnauthorizedError.md)
- [`ValidationError`](../../validationError/classes/ValidationError.md)

## Constructors

### new ApplicationError()

> **new ApplicationError**(`errors`, `httpCode`, `message`): [`ApplicationError`](ApplicationError.md)

Creates an instance of ApplicationError.

#### Parameters

##### errors

[`InterfaceError`](../interfaces/InterfaceError.md)[]

An array of errors conforming to the InterfaceError interface.

##### httpCode

`number` = `422`

The HTTP status code associated with the error (default is 422).

##### message

`string` = `"Error"`

The error message (default is "Error").

#### Returns

[`ApplicationError`](ApplicationError.md)

#### Overrides

`Error.constructor`

#### Defined in

[src/libraries/errors/applicationError.ts:32](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/libraries/errors/applicationError.ts#L32)

## Properties

### errors

> **errors**: [`InterfaceError`](../interfaces/InterfaceError.md)[]

An array of errors conforming to the InterfaceError interface

#### Defined in

[src/libraries/errors/applicationError.ts:21](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/libraries/errors/applicationError.ts#L21)

***

### httpCode

> **httpCode**: `any`

The HTTP status code associated with the error

#### Defined in

[src/libraries/errors/applicationError.ts:23](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/libraries/errors/applicationError.ts#L23)
