[Admin Docs](/)

***

# Function: createGraphQLConnectionWithWhereSchema()

> **createGraphQLConnectionWithWhereSchema**\<`T`\>(`whereSchema`): `ZodObject`\<`extendShape`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; \}, \{ `where`: `ZodNullable`\<`ZodDefault`\<`T`\>\>; \}\>, `"strip"`, \{ \[k in "where" \| "after" \| "before" \| "first" \| "last"\]: addQuestionMarks\<baseObjectOutputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>, any\>\[k\] \}, \{ \[k in "where" \| "after" \| "before" \| "first" \| "last"\]: baseObjectInputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>\[k\] \}\>

Helper function to create a schema for connection arguments with a where clause.
Extends the default connection arguments schema with a custom where schema.

## Type Parameters

• **T** *extends* `ZodType`

## Parameters

### whereSchema

`T`

The Zod schema for the where clause

## Returns

`ZodObject`\<`extendShape`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; \}, \{ `where`: `ZodNullable`\<`ZodDefault`\<`T`\>\>; \}\>, `"strip"`, \{ \[k in "where" \| "after" \| "before" \| "first" \| "last"\]: addQuestionMarks\<baseObjectOutputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>, any\>\[k\] \}, \{ \[k in "where" \| "after" \| "before" \| "first" \| "last"\]: baseObjectInputType\<extendShape\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string, string\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number, number\> \}, \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\>\[k\] \}\>

A Zod schema for connection arguments with the where clause

## Defined in

[src/utilities/defaultGraphQLConnection.ts:147](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/utilities/defaultGraphQLConnection.ts#L147)
