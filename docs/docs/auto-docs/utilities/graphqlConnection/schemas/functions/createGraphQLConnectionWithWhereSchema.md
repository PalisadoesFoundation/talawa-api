[API Docs](/)

***

# Function: createGraphQLConnectionWithWhereSchema()

> **createGraphQLConnectionWithWhereSchema**\<`T`\>(`whereSchema`): `ZodObject`\<`object` & `object`, `"strip"`, `ZodTypeAny`, \{ \[k in "first" \| "last" \| "before" \| "after" \| "where"\]: addQuestionMarks\<baseObjectOutputType\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\> \} & \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>, any\>\[k\] \}, \{ \[k in "first" \| "last" \| "before" \| "after" \| "where"\]: baseObjectInputType\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\> \} & \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\[k\] \}\>

Defined in: [src/utilities/graphqlConnection/schemas.ts:36](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/graphqlConnection/schemas.ts#L36)

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

`ZodObject`\<`object` & `object`, `"strip"`, `ZodTypeAny`, \{ \[k in "first" \| "last" \| "before" \| "after" \| "where"\]: addQuestionMarks\<baseObjectOutputType\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\> \} & \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>, any\>\[k\] \}, \{ \[k in "first" \| "last" \| "before" \| "after" \| "where"\]: baseObjectInputType\<\{ after: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; before: ZodEffects\<ZodOptional\<ZodNullable\<ZodString\>\>, string \| undefined, string \| null \| undefined\>; first: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\>; last: ZodEffects\<ZodOptional\<ZodNullable\<ZodNumber\>\>, number \| undefined, number \| null \| undefined\> \} & \{ where: ZodNullable\<ZodDefault\<T\>\> \}\>\[k\] \}\>

- A Zod schema for connection arguments with the where clause
