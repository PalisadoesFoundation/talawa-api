[talawa-api](../README.md) / [Exports](../modules.md) / [libraries/errors/invalidFileTypeError](../modules/libraries_errors_invalidFileTypeError.md) / InvalidFileTypeError

# Class: InvalidFileTypeError

[libraries/errors/invalidFileTypeError](../modules/libraries_errors_invalidFileTypeError.md).InvalidFileTypeError

This class detects invalid file type errors and sends those errors to the superclass ApplicationError.

## Hierarchy

- [`ApplicationError`](libraries_errors_applicationError.ApplicationError.md)

  ↳ **`InvalidFileTypeError`**

## Table of contents

### Constructors

- [constructor](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#constructor)

### Properties

- [errors](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#errors)
- [httpCode](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#httpcode)
- [message](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#message)
- [name](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#name)
- [stack](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#stack)
- [prepareStackTrace](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#preparestacktrace)
- [stackTraceLimit](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#stacktracelimit)

### Methods

- [captureStackTrace](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md#capturestacktrace)

## Constructors

### constructor

• **new InvalidFileTypeError**(`message?`, `code?`, `param?`, `metadata?`): [`InvalidFileTypeError`](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `message` | `string` | `"Invalid File Type"` |
| `code` | ``null`` \| `string` | `null` |
| `param` | ``null`` \| `string` | `null` |
| `metadata` | `Record`\<`any`, `any`\> | `{}` |

#### Returns

[`InvalidFileTypeError`](libraries_errors_invalidFileTypeError.InvalidFileTypeError.md)

#### Overrides

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[constructor](libraries_errors_applicationError.ApplicationError.md#constructor)

#### Defined in

[src/libraries/errors/invalidFileTypeError.ts:6](https://github.com/PalisadoesFoundation/talawa-api/blob/cba820f/src/libraries/errors/invalidFileTypeError.ts#L6)

## Properties

### errors

• **errors**: [`InterfaceError`](../interfaces/libraries_errors_applicationError.InterfaceError.md)[]

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[errors](libraries_errors_applicationError.ApplicationError.md#errors)

#### Defined in

[src/libraries/errors/applicationError.ts:11](https://github.com/PalisadoesFoundation/talawa-api/blob/cba820f/src/libraries/errors/applicationError.ts#L11)

___

### httpCode

• **httpCode**: `number`

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[httpCode](libraries_errors_applicationError.ApplicationError.md#httpcode)

#### Defined in

[src/libraries/errors/applicationError.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/cba820f/src/libraries/errors/applicationError.ts#L12)

___

### message

• **message**: `string`

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[message](libraries_errors_applicationError.ApplicationError.md#message)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1076

___

### name

• **name**: `string`

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[name](libraries_errors_applicationError.ApplicationError.md#name)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1075

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[stack](libraries_errors_applicationError.ApplicationError.md#stack)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1077

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

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

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[prepareStackTrace](libraries_errors_applicationError.ApplicationError.md#preparestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:28

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[stackTraceLimit](libraries_errors_applicationError.ApplicationError.md#stacktracelimit)

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

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[captureStackTrace](libraries_errors_applicationError.ApplicationError.md#capturestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:21
