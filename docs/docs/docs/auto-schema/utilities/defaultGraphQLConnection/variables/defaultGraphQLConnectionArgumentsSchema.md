[Admin Docs](/)

***

# Variable: defaultGraphQLConnectionArgumentsSchema

> `const` **defaultGraphQLConnectionArgumentsSchema**: `ZodObject`\<\{ `after`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `before`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>, `string`, `string`\>; `first`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; `last`: `ZodEffects`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>, `number`, `number`\>; \}, `"strip"`, \{ `after`: `string`; `before`: `string`; `first`: `number`; `last`: `number`; \}, \{ `after`: `string`; `before`: `string`; `first`: `number`; `last`: `number`; \}\>

Zod schema to parse the default graphql connection arguments and transform them to make them easier to work with.

## Defined in

[src/utilities/defaultGraphQLConnection.ts:41](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/utilities/defaultGraphQLConnection.ts#L41)
