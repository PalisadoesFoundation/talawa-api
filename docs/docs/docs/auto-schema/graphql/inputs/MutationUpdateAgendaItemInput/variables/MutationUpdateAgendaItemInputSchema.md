[Admin Docs](/)

***

# Variable: MutationUpdateAgendaItemInputSchema

> `const` **MutationUpdateAgendaItemInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `duration`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `folderId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `key`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `type`: `ZodEnum`\<\[`"general"`, `"note"`, `"scripture"`, `"song"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"duration"` \| `"description"` \| `"key"`\>, \{ `folderId`: `ZodOptional`\<`ZodString`\>; `id`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `description?`: `null` \| `string`; `duration?`: `null` \| `string`; `folderId?`: `string`; `id`: `string`; `key?`: `null` \| `string`; `name?`: `string`; \}, \{ `description?`: `null` \| `string`; `duration?`: `null` \| `string`; `folderId?`: `string`; `id`: `string`; `key?`: `null` \| `string`; `name?`: `string`; \}\>, \{ `description?`: `null` \| `string`; `duration?`: `null` \| `string`; `folderId?`: `string`; `id`: `string`; `key?`: `null` \| `string`; `name?`: `string`; \}, \{ `description?`: `null` \| `string`; `duration?`: `null` \| `string`; `folderId?`: `string`; `id`: `string`; `key?`: `null` \| `string`; `name?`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateAgendaItemInput.ts:5](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/inputs/MutationUpdateAgendaItemInput.ts#L5)
