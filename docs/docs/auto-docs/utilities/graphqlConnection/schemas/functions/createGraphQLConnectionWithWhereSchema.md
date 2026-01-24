[**talawa-api**](../../../../README.md)

***

# Function: createGraphQLConnectionWithWhereSchema()

> **createGraphQLConnectionWithWhereSchema**\<`T`\>(`whereSchema`): `ZodObject`\<`object` & `object`, `"strip"`, `ZodTypeAny`, \{ `after?`: `string`; `before?`: `string`; `first?`: `number`; `last?`: `number`; `where?`: `any`; \}, \{ `after?`: `string` \| `null`; `before?`: `string` \| `null`; `first?`: `number` \| `null`; `last?`: `number` \| `null`; `where?`: `any`; \}\>

Defined in: src/utilities/graphqlConnection/schemas.ts:36

Helper function to create a schema for connection arguments with a where clause.
Extends the default connection arguments schema with a custom where schema.

## Type Parameters

### T

`T` *extends* `ZodTypeAny`

## Parameters

### whereSchema

`T`

The Zod schema for the where clause

## Returns

`ZodObject`\<`object` & `object`, `"strip"`, `ZodTypeAny`, \{ `after?`: `string`; `before?`: `string`; `first?`: `number`; `last?`: `number`; `where?`: `any`; \}, \{ `after?`: `string` \| `null`; `before?`: `string` \| `null`; `first?`: `number` \| `null`; `last?`: `number` \| `null`; `where?`: `any`; \}\>

- A Zod schema for connection arguments with the where clause
