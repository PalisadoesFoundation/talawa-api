[Admin Docs](/)

***

# Variable: defaultGraphQLConnectionArgumentsSchema

> `const` **defaultGraphQLConnectionArgumentsSchema**: `ZodObject`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; \}, `"strip"`, `ZodTypeAny`, \{ `after?`: `string`; `before?`: `string`; `first?`: `number`; `last?`: `number`; \}, \{ `after?`: `null` \| `string`; `before?`: `null` \| `string`; `first?`: `null` \| `number`; `last?`: `null` \| `number`; \}\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:41](https://github.com/Sourya07/talawa-api/blob/ead7a48e0174153214ee7311f8b242ee1c1a12ca/src/utilities/defaultGraphQLConnection.ts#L41)

Zod schema to parse the default graphql connection arguments and transform them to make them easier to work with.
