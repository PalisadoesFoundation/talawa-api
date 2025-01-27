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

[src/libraries/dbLogger.ts:8](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/libraries/dbLogger.ts#L8)
