[**talawa-api**](../../../README.md)

***

# Type Alias: TransactionLogInfo

> **TransactionLogInfo**: `object`

The structure of a transaction log entry.

## Type declaration

### model

> **model**: `string`

The name of the model associated with the log entry

### query?

> `optional` **query**: `string`

The query executed (optional)

### timestamp

> **timestamp**: `string`

The timestamp when the log entry was created

### type

> **type**: `string`

The type of transaction (e.g., create, update, delete)

### update?

> `optional` **update**: `string`

The update performed (optional)

## Defined in

[src/libraries/dbLogger.ts:8](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/libraries/dbLogger.ts#L8)
