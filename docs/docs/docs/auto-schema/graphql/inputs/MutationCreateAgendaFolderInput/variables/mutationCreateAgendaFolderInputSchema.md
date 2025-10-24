[Admin Docs](/)

***

# Variable: mutationCreateAgendaFolderInputSchema

> `const` **mutationCreateAgendaFolderInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `eventId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `isAgendaItemFolder`: `ZodBoolean`; `name`: `ZodString`; `parentFolderId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"parentFolderId"` \| `"eventId"` \| `"isAgendaItemFolder"`\>, `"strip"`, `ZodTypeAny`, \{ `eventId`: `string`; `isAgendaItemFolder`: `boolean`; `name`: `string`; `parentFolderId?`: `null` \| `string`; \}, \{ `eventId`: `string`; `isAgendaItemFolder`: `boolean`; `name`: `string`; `parentFolderId?`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateAgendaFolderInput.ts:5](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationCreateAgendaFolderInput.ts#L5)
