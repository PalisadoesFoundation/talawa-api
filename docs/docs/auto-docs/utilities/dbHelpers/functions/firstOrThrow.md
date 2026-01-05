[API Docs](/)

***

# Function: firstOrThrow()

> **firstOrThrow**\<`T`\>(`rows`, `errorMessage`): `T`

Defined in: [src/utilities/dbHelpers.ts:17](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dbHelpers.ts#L17)

Normalizes database query results to ensure a single row is returned or throws an error.
This helper ensures consistent behavior when dealing with database operations that may
return arrays, single objects, null, or undefined.

## Type Parameters

### T

`T`

## Parameters

### rows

Database query result (array, single object, null, or undefined)

`T` | `T`[] | `null` | `undefined`

### errorMessage

`string` = `"Unexpected DB operation failure"`

Optional custom error message

## Returns

`T`

The first row from the result, or throws if no row exists

## Throws

TalawaGraphQLError with code "unexpected" if no row is found

## Example

```ts
const rows = await db.insert(table).values({...}).returning();
const created = await firstOrThrow(rows, "Failed to create record");
```
