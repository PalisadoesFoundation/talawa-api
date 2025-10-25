[Admin Docs](/)

***

# Variable: mutationCreateChatMessageInputSchema

> `const` **mutationCreateChatMessageInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `body`: `ZodString`; `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `parentMessageId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"chatId"` \| `"body"`\>, \{ `parentMessageId`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string`; \}, \{ `body`: `string`; `chatId`: `string`; `parentMessageId?`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatMessageInput.ts:5](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/MutationCreateChatMessageInput.ts#L5)
