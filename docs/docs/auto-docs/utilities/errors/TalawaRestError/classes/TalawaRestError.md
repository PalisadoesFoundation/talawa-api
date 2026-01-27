[API Docs](/)

***

# Class: TalawaRestError

Defined in: src/utilities/errors/TalawaRestError.ts:10

## Extends

- `Error`

## Constructors

### Constructor

> **new TalawaRestError**(`options`): `TalawaRestError`

Defined in: src/utilities/errors/TalawaRestError.ts:15

#### Parameters

##### options

[`TalawaRestErrorOptions`](../interfaces/TalawaRestErrorOptions.md)

#### Returns

`TalawaRestError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: [`ErrorCode`](../../errorCodes/enumerations/ErrorCode.md)

Defined in: src/utilities/errors/TalawaRestError.ts:11

***

### details?

> `readonly` `optional` **details**: `Record`\<`string`, `unknown`\>

Defined in: src/utilities/errors/TalawaRestError.ts:12

***

### statusCode

> `readonly` **statusCode**: `number`

Defined in: src/utilities/errors/TalawaRestError.ts:13
