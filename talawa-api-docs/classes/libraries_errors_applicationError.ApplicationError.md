[talawa-api](../README.md) / [Exports](../modules.md) / [libraries/errors/applicationError](../modules/libraries_errors_applicationError.md) / ApplicationError

# Class: ApplicationError

[libraries/errors/applicationError](../modules/libraries_errors_applicationError.md).ApplicationError

This class is responsible for finding the application errors. It adds those errors to superclass called Error.

## Hierarchy

- `Error`

  ↳ **`ApplicationError`**

  ↳↳ [`ImageSizeLimitExceeded`](libraries_errors_ImageSizeLimitExceeded.ImageSizeLimitExceeded.md)

  ↳↳ [`ConflictError`](libraries_errors_conflictError.ConflictError.md)

  ↳↳ [`InputValidationError`](libraries_errors_inputValidationError.InputValidationError.md)

  ↳↳ [`InternalServerError`](libraries_errors_internalServerError.InternalServerError.md)

  ↳↳ [`InvalidFileTypeError`](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md)

  ↳↳ [`NotFoundError`](libraries_errors_notFoundError.NotFoundError.md)

  ↳↳ [`UnauthenticatedError`](libraries_errors_unauthenticatedError.UnauthenticatedError.md)

  ↳↳ [`UnauthorizedError`](libraries_errors_unauthorizedError.UnauthorizedError.md)

  ↳↳ [`ValidationError`](libraries_errors_validationError.ValidationError.md)

## Table of contents

### Constructors

- [constructor](libraries_errors_applicationError.ApplicationError.md#constructor)

### Properties

- [errors](libraries_errors_applicationError.ApplicationError.md#errors)
- [httpCode](libraries_errors_applicationError.ApplicationError.md#httpcode)
- [message](libraries_errors_applicationError.ApplicationError.md#message)
- [name](libraries_errors_applicationError.ApplicationError.md#name)
- [stack](libraries_errors_applicationError.ApplicationError.md#stack)
- [prepareStackTrace](libraries_errors_applicationError.ApplicationError.md#preparestacktrace)
- [stackTraceLimit](libraries_errors_applicationError.ApplicationError.md#stacktracelimit)

### Methods

- [captureStackTrace](libraries_errors_applicationError.ApplicationError.md#capturestacktrace)

## Constructors

### constructor

• **new ApplicationError**(`errors`, `httpCode?`, `message?`): [`ApplicationError`](libraries_errors_applicationError.ApplicationError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `errors` | [`InterfaceError`](../interfaces/libraries_errors_applicationError.InterfaceError.md)[] | `undefined` |
| `httpCode` | `number` | `422` |
| `message` | `string` | `"Error"` |

#### Returns

[`ApplicationError`](libraries_errors_applicationError.ApplicationError.md)

#### Overrides

Error.constructor

#### Defined in

[src/libraries/errors/applicationError.ts:14](https://github.com/PalisadoesFoundation/talawa-api/blob/8707a9c/src/libraries/errors/applicationError.ts#L14)

## Properties

### errors

• **errors**: [`InterfaceError`](../interfaces/libraries_errors_applicationError.InterfaceError.md)[]

#### Defined in

[src/libraries/errors/applicationError.ts:11](https://github.com/PalisadoesFoundation/talawa-api/blob/8707a9c/src/libraries/errors/applicationError.ts#L11)

___

### httpCode

• **httpCode**: `number`

#### Defined in

[src/libraries/errors/applicationError.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/8707a9c/src/libraries/errors/applicationError.ts#L12)

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1076

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1075

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1077

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) =\> `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:28

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:30

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:21
