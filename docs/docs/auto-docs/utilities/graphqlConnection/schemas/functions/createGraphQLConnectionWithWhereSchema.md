[API Docs](/)

***

# Function: createGraphQLConnectionWithWhereSchema()

> **createGraphQLConnectionWithWhereSchema**\<`T`\>(`whereSchema`): `ZodObject`\<\{ `after`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `ZodTransform`\<`string` \| `undefined`, `string` \| `null` \| `undefined`\>\>; `before`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `ZodTransform`\<`string` \| `undefined`, `string` \| `null` \| `undefined`\>\>; `first`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `ZodTransform`\<`number` \| `undefined`, `number` \| `null` \| `undefined`\>\>; `last`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `ZodTransform`\<`number` \| `undefined`, `number` \| `null` \| `undefined`\>\>; `where`: `ZodDefault`\<`ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>; \}, `$strip`\>

Defined in: [src/utilities/graphqlConnection/schemas.ts:36](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/graphqlConnection/schemas.ts#L36)

Helper function to create a schema for connection arguments with a where clause.
Extends the default connection arguments schema with a custom where schema.

## Type Parameters

### T

`T` *extends* `ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>

## Parameters

### whereSchema

`T`

The Zod schema for the where clause

## Returns

`ZodObject`\<\{ `after`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `ZodTransform`\<`string` \| `undefined`, `string` \| `null` \| `undefined`\>\>; `before`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `ZodTransform`\<`string` \| `undefined`, `string` \| `null` \| `undefined`\>\>; `first`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `ZodTransform`\<`number` \| `undefined`, `number` \| `null` \| `undefined`\>\>; `last`: `ZodPipe`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `ZodTransform`\<`number` \| `undefined`, `number` \| `null` \| `undefined`\>\>; `where`: `ZodDefault`\<`ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>\>; \}, `$strip`\>

- A Zod schema for connection arguments with the where clause
