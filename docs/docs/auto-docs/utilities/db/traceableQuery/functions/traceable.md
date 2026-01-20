[API Docs](/)

***

# Function: traceable()

> **traceable**\<`T`\>(`model`, `op`, `fn`): `Promise`\<`T`\>

Defined in: src/utilities/db/traceableQuery.ts:20

Wraps a database operation with OpenTelemetry tracing.
Creates a span for the operation with safe attributes (no SQL or PII).

## Type Parameters

### T

`T`

## Parameters

### model

`string`

The model/table name (e.g., "users", "organizations")

### op

`string`

The operation type (e.g., "batchLoad", "findById", "insert")

### fn

() => `Promise`\<`T`\>

The async function that performs the database operation

## Returns

`Promise`\<`T`\>

The result of the database operation

## Example

```typescript
const users = await traceable("users", "batchLoad", async () => {
  return db.select().from(usersTable).where(inArray(usersTable.id, ids));
});
```
