[API Docs](/)

***

# Variable: mutationCreateAgendaItemInputSchema

> `const` **mutationCreateAgendaItemInputSchema**: `ZodEffects`\<`ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `duration`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `folderId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `key`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `type`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"duration"` \| `"type"` \| `"description"` \| `"name"` \| `"folderId"` \| `"key"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `attachments?`: `object`[]; `description?`: `string` \| `null`; `duration?`: `string` \| `null`; `folderId`: `string`; `key?`: `string` \| `null`; `name`: `string`; `type`: `string`; \}, \{ `attachments?`: `object`[]; `description?`: `string` \| `null`; `duration?`: `string` \| `null`; `folderId`: `string`; `key?`: `string` \| `null`; `name`: `string`; `type`: `string`; \}\>, \{ `attachments?`: `object`[]; `description?`: `string` \| `null`; `duration?`: `string` \| `null`; `folderId`: `string`; `key?`: `string` \| `null`; `name`: `string`; `type`: `string`; \}, \{ `attachments?`: `object`[]; `description?`: `string` \| `null`; `duration?`: `string` \| `null`; `folderId`: `string`; `key?`: `string` \| `null`; `name`: `string`; `type`: `string`; \}\>

Defined in: src/graphql/inputs/MutationCreateAgendaItemInput.ts:10
