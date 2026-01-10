[API Docs](/)

***

# Variable: mutationCreateAgendaFolderInputSchema

> `const` **mutationCreateAgendaFolderInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `eventId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `isAgendaItemFolder`: `ZodBoolean`; `isDefaultFolder`: `ZodOptional`\<`ZodBoolean`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `parentFolderId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `sequence`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"name"` \| `"description"` \| `"organizationId"` \| `"eventId"` \| `"isAgendaItemFolder"` \| `"parentFolderId"` \| `"sequence"`\>, `"strip"`, `ZodTypeAny`, \{ `description?`: `string` \| `null`; `eventId`: `string`; `isAgendaItemFolder`: `boolean`; `name`: `string`; `organizationId`: `string`; `parentFolderId?`: `string` \| `null`; `sequence?`: `number` \| `null`; \}, \{ `description?`: `string` \| `null`; `eventId`: `string`; `isAgendaItemFolder`: `boolean`; `name`: `string`; `organizationId`: `string`; `parentFolderId?`: `string` \| `null`; `sequence?`: `number` \| `null`; \}\>

Defined in: [src/graphql/inputs/MutationCreateAgendaFolderInput.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateAgendaFolderInput.ts#L5)
