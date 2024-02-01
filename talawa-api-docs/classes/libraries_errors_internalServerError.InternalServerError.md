[talawa-api](../README.md) / [Exports](../modules.md) / [libraries/errors/internalServerError](../modules/libraries_errors_internalServerError.md) / InternalServerError

# Class: InternalServerError

[libraries/errors/internalServerError](../modules/libraries_errors_internalServerError.md).InternalServerError

This class detects internal server errors and sends those errors to the superclass ApplicationError.

## Hierarchy

- [`ApplicationError`](libraries_errors_applicationError.ApplicationError.md)

  ↳ **`InternalServerError`**

## Table of contents

### Constructors

- [constructor](libraries_errors_internalServerError.InternalServerError.md#constructor)

### Properties

- [errors](libraries_errors_internalServerError.InternalServerError.md#errors)
- [httpCode](libraries_errors_internalServerError.InternalServerError.md#httpcode)
- [message](libraries_errors_internalServerError.InternalServerError.md#message)
- [name](libraries_errors_internalServerError.InternalServerError.md#name)
- [stack](libraries_errors_internalServerError.InternalServerError.md#stack)
- [prepareStackTrace](libraries_errors_internalServerError.InternalServerError.md#preparestacktrace)
- [stackTraceLimit](libraries_errors_internalServerError.InternalServerError.md#stacktracelimit)

### Methods

- [captureStackTrace](libraries_errors_internalServerError.InternalServerError.md#capturestacktrace)

## Constructors

### constructor

• **new InternalServerError**(`message?`, `code?`, `param?`, `metadata?`): [`InternalServerError`](libraries_errors_internalServerError.InternalServerError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `message` | `string` | `"Internal Server Error!"` |
| `code` | ``null`` \| `string` | `null` |
| `param` | ``null`` \| `string` | `null` |
| `metadata` | `Record`\<`any`, `any`\> | `{}` |

#### Returns

[`InternalServerError`](libraries_errors_internalServerError.InternalServerError.md)

#### Overrides

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[constructor](libraries_errors_applicationError.ApplicationError.md#constructor)

#### Defined in

[src/libraries/errors/internalServerError.ts:6](https://github.com/PalisadoesFoundation/talawa-api/blob/3677888/src/libraries/errors/internalServerError.ts#L6)

## Properties

### errors

• **errors**: [`InterfaceError`](../interfaces/libraries_errors_applicationError.InterfaceError.md)[]

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[errors](libraries_errors_applicationError.ApplicationError.md#errors)

#### Defined in

[src/libraries/errors/applicationError.ts:11](https://github.com/PalisadoesFoundation/talawa-api/blob/3677888/src/libraries/errors/applicationError.ts#L11)

___

### httpCode

• **httpCode**: `number`

#### Inherited from

[ApplicationError](libraries_errors_applicationError.ApplicationError.md).[httpCode](libraries_errors_applicationError.ApplicationError.md#httpcode)

#### Defined in

[src/libraries/errors/applicationError.ts:12](https://github.com/PalisadoesFoundation/talawa-api/blob/3677888/src/libraries/errors/applicationError.ts#L12)

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
