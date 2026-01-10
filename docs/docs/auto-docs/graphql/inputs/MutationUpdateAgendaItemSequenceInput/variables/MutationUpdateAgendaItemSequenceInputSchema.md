[API Docs](/)

***

# Variable: MutationUpdateAgendaItemSequenceInputSchema

> `const` **MutationUpdateAgendaItemSequenceInputSchema**: `ZodEffects`\<`ZodObject`\<`Pick`\<\{ `categoryId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `duration`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `eventId`: `ZodString`; `folderId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `key`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `notes`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `sequence`: `ZodNumber`; `type`: `ZodEnum`\<\[`"general"`, `"note"`, `"scripture"`, `"song"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"sequence"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `sequence`: `number`; \}, \{ `id`: `string`; `sequence`: `number`; \}\>, \{ `id`: `string`; `sequence`: `number`; \}, \{ `id`: `string`; `sequence`: `number`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateAgendaItemSequenceInput.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationUpdateAgendaItemSequenceInput.ts#L5)
