[API Docs](/)

***

# Variable: mutationCreateAgendaCategoriesInputSchema

> `const` **mutationCreateAgendaCategoriesInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `eventId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `isDefaultCategory`: `ZodOptional`\<`ZodBoolean`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"description"` \| `"organizationId"` \| `"eventId"`\>, `"strip"`, `ZodTypeAny`, \{ `description?`: `string` \| `null`; `eventId`: `string`; `name`: `string`; `organizationId`: `string`; \}, \{ `description?`: `string` \| `null`; `eventId`: `string`; `name`: `string`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateAgendaCategoryInput.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateAgendaCategoryInput.ts#L5)
