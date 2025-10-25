[Admin Docs](/)

***

# Variable: defaultGraphQLConnectionArgumentsSchema

> `const` **defaultGraphQLConnectionArgumentsSchema**: `ZodObject`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `undefined` \| `string`, `undefined` \| `null` \| `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `undefined` \| `number`, `undefined` \| `null` \| `number`\>; \}, `"strip"`, `ZodTypeAny`, \{ `after?`: `string`; `before?`: `string`; `first?`: `number`; `last?`: `number`; \}, \{ `after?`: `null` \| `string`; `before?`: `null` \| `string`; `first?`: `null` \| `number`; `last?`: `null` \| `number`; \}\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:41](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/utilities/defaultGraphQLConnection.ts#L41)

Zod schema to parse the default graphql connection arguments and transform them to make them easier to work with.
