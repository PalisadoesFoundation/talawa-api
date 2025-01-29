[**talawa-api**](../../../../README.md)

***

# Class: ImageSizeLimitExceeded

This class represents an error indicating that the image size limit has been exceeded.
It extends the ApplicationError class to handle and format the error information.

## Extends

- [`ApplicationError`](../../applicationError/classes/ApplicationError.md)

## Constructors

### new ImageSizeLimitExceeded()

> **new ImageSizeLimitExceeded**(`message`, `code`, `param`, `metadata`): [`ImageSizeLimitExceeded`](ImageSizeLimitExceeded.md)

Creates an instance of ImageSizeLimitExceeded.

#### Parameters

##### message

`string` = `"Image Size Limit Exceeded"`

The error message (default is "Image Size Limit Exceeded").

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

[`ImageSizeLimitExceeded`](ImageSizeLimitExceeded.md)

#### Overrides

[`ApplicationError`](../../applicationError/classes/ApplicationError.md).[`constructor`](../../applicationError/classes/ApplicationError.md#constructors)

#### Defined in

[src/libraries/errors/ImageSizeLimitExceeded.ts:16](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/libraries/errors/ImageSizeLimitExceeded.ts#L16)

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
