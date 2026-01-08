[API Docs](/)

***

# Variable: mutationCreateChatMessageInputSchema

> `const` **mutationCreateChatMessageInputSchema**: `ZodObject`\<`Pick`\<\{ `body`: `ZodString`; `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `parentMessageId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"chatId"` \| `"body"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string`; \}, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatMessageInput.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateChatMessageInput.ts#L5)
