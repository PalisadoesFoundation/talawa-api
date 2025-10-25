[Admin Docs](/)

***

# Variable: mutationCreateTagInputSchema

> `const` **mutationCreateTagInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `folderId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"organizationId"` \| `"folderId"`\>, `"strip"`, `ZodTypeAny`, \{ `folderId?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; \}, \{ `folderId?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateTagInput.ts:5](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/inputs/MutationCreateTagInput.ts#L5)
