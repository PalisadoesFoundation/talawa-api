[API Docs](/)

***

# Class: TalawaRestError

Defined in: [src/utilities/errors/TalawaRestError.ts:10](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L10)

## Extends

- `Error`

## Constructors

### Constructor

> **new TalawaRestError**(`options`): `TalawaRestError`

Defined in: [src/utilities/errors/TalawaRestError.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L15)

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

Defined in: [src/utilities/errors/TalawaRestError.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L11)

***

### details?

> `readonly` `optional` **details**: `Record`\<`string`, `unknown`\>

Defined in: [src/utilities/errors/TalawaRestError.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L12)

***

### statusCode

> `readonly` **statusCode**: `number`

Defined in: [src/utilities/errors/TalawaRestError.ts:13](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/errors/TalawaRestError.ts#L13)
