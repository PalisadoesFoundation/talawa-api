[Admin Docs](/)

***

# Variable: mutationCreateTagInputSchema

> `const` **mutationCreateTagInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `folderId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"organizationId"` \| `"folderId"`\>, `"strip"`, `ZodTypeAny`, \{ `folderId?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; \}, \{ `folderId?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateTagInput.ts:5](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationCreateTagInput.ts#L5)
