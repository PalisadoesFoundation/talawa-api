[Admin Docs](/)

***

# Variable: mutationUpdateAgendaFolderInputSchema

> `const` **mutationUpdateAgendaFolderInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `eventId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `isAgendaItemFolder`: `ZodBoolean`; `name`: `ZodString`; `parentFolderId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"parentFolderId"`\>, \{ `id`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `name?`: `string`; `parentFolderId?`: `null` \| `string`; \}, \{ `id`: `string`; `name?`: `string`; `parentFolderId?`: `null` \| `string`; \}\>, \{ `id`: `string`; `name?`: `string`; `parentFolderId?`: `null` \| `string`; \}, \{ `id`: `string`; `name?`: `string`; `parentFolderId?`: `null` \| `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateAgendaFolderInput.ts:5](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/inputs/MutationUpdateAgendaFolderInput.ts#L5)
