[Admin Docs](/)

***

# Variable: mutationCreateChatMessageInputSchema

> `const` **mutationCreateChatMessageInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `body`: `ZodString`; `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `parentMessageId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"chatId"` \| `"body"`\>, \{ `parentMessageId`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string`; \}, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatMessageInput.ts:5](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/graphql/inputs/MutationCreateChatMessageInput.ts#L5)
