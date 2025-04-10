[Admin Docs](/)

***

# Variable: defaultGraphQLConnectionArgumentsSchema

> `const` **defaultGraphQLConnectionArgumentsSchema**: `ZodObject`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; \}, `"strip"`, `ZodTypeAny`, \{ `after`: `string`; `before`: `string`; `first`: `number`; `last`: `number`; \}, \{ `after`: `string`; `before`: `string`; `first`: `number`; `last`: `number`; \}\>

Defined in: [src/utilities/defaultGraphQLConnection.ts:41](https://github.com/PurnenduMIshra129th/talawa-api/blob/75f0e499b44e2c3bed70cf951ac8ac374317f43b/src/utilities/defaultGraphQLConnection.ts#L41)

Zod schema to parse the default graphql connection arguments and transform them to make them easier to work with.
