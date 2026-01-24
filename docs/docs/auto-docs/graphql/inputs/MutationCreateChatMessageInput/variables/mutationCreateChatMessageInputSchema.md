[**talawa-api**](../../../../README.md)

***

# Variable: mutationCreateChatMessageInputSchema

> `const` **mutationCreateChatMessageInputSchema**: `ZodObject`\<`Pick`\<\{ `body`: `ZodString`; `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `id`: `ZodOptional`\<`ZodString`\>; `parentMessageId`: `ZodNullable`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"chatId"` \| `"body"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string` \| `null`; \}, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string` \| `null`; \}\>

Defined in: src/graphql/inputs/MutationCreateChatMessageInput.ts:5
