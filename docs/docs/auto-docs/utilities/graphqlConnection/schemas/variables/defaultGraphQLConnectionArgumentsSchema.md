[**talawa-api**](../../../../README.md)

***

# Variable: defaultGraphQLConnectionArgumentsSchema

> `const` **defaultGraphQLConnectionArgumentsSchema**: `ZodObject`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string` \| `undefined`, `string` \| `null` \| `undefined`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string` \| `undefined`, `string` \| `null` \| `undefined`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number` \| `undefined`, `number` \| `null` \| `undefined`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number` \| `undefined`, `number` \| `null` \| `undefined`\>; \}, `"strip"`, `ZodTypeAny`, \{ `after?`: `string`; `before?`: `string`; `first?`: `number`; `last?`: `number`; \}, \{ `after?`: `string` \| `null`; `before?`: `string` \| `null`; `first?`: `number` \| `null`; `last?`: `number` \| `null`; \}\>

Defined in: src/utilities/graphqlConnection/schemas.ts:6

Zod schema to parse the default graphql connection arguments and transform them to make them easier to work with.
