[API Docs](/)

***

# Variable: mutationCreateTagFolderInputSchema

> `const` **mutationCreateTagFolderInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `parentFolderId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"organizationId"` \| `"parentFolderId"`\>, `"strip"`, `ZodTypeAny`, \{ `name`: `string`; `organizationId`: `string`; `parentFolderId?`: `string` \| `null`; \}, \{ `name`: `string`; `organizationId`: `string`; `parentFolderId?`: `string` \| `null`; \}\>

Defined in: [src/graphql/inputs/MutationCreateTagFolderInput.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateTagFolderInput.ts#L5)
