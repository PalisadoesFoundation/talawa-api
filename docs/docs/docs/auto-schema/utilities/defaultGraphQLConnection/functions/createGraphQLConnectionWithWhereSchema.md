[Admin Docs](/)

***

# Function: createGraphQLConnectionWithWhereSchema()

> **createGraphQLConnectionWithWhereSchema**\<`T`\>(`whereSchema`): `ZodObject`\<`extendShape`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; \}, \{ `where`: `ZodNullable`\<`ZodDefault`\<`T`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ \[k in "where" \| "after" \| "first" \| "last" \| "before"\]: addQuestionMarks\<baseObjectOutputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>, any\>\[k\] \}, \{ \[k in "where" \| "after" \| "first" \| "last" \| "before"\]: baseObjectInputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>\[k\] \}\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:147](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/utilities/defaultGraphQLConnection.ts#L147)

Helper function to create a schema for connection arguments with a where clause.
Extends the default connection arguments schema with a custom where schema.

## Type Parameters

### T

`T` *extends* `ZodType`\<`any`, `ZodTypeDef`, `any`\>

## Parameters

### whereSchema

`T`

The Zod schema for the where clause

## Returns

`ZodObject`\<`extendShape`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; \}, \{ `where`: `ZodNullable`\<`ZodDefault`\<`T`\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ \[k in "where" \| "after" \| "first" \| "last" \| "before"\]: addQuestionMarks\<baseObjectOutputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>, any\>\[k\] \}, \{ \[k in "where" \| "after" \| "first" \| "last" \| "before"\]: baseObjectInputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, undefined \| string, undefined \| null \| string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, undefined \| number, undefined \| null \| number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>\[k\] \}\>

A Zod schema for connection arguments with the where clause
