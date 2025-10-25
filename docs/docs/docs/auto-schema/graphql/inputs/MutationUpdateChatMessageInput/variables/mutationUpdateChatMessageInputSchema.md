[Admin Docs](/)

***

# Variable: mutationUpdateChatMessageInputSchema

> `const` **mutationUpdateChatMessageInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `body`: `ZodString`; `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `parentMessageId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"body"`\>, \{ `id`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `body`: `string`; `id`: `string`; \}, \{ `body`: `string`; `id`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateChatMessageInput.ts:5](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/MutationUpdateChatMessageInput.ts#L5)
