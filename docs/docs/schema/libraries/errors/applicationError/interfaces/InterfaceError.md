[**talawa-api**](../../../../README.md)

***

# Interface: InterfaceError

Interface representing the structure of an error.

## Properties

### code

> **code**: `string`

The error code, can be null

#### Defined in

[src/libraries/errors/applicationError.ts:8](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/applicationError.ts#L8)

***

### message

> **message**: `string`

The error message

#### Defined in

[src/libraries/errors/applicationError.ts:6](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/applicationError.ts#L6)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `string`\>

Optional additional metadata associated with the error

#### Defined in

[src/libraries/errors/applicationError.ts:12](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/applicationError.ts#L12)

***

### param

> **param**: `string`

The parameter associated with the error, can be null

#### Defined in

[src/libraries/errors/applicationError.ts:10](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/libraries/errors/applicationError.ts#L10)
