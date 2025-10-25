[Admin Docs](/)

***

# Variable: mutationDeleteChatMembershipInputSchema

> `const` **mutationDeleteChatMembershipInputSchema**: `ZodObject`\<`Pick`\<\{ `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `lastReadAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `memberId`: `ZodString`; `role`: `ZodEnum`\<\[`"administrator"`, `"regular"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"chatId"` \| `"memberId"`\>, `"strip"`, `ZodTypeAny`, \{ `chatId`: `string`; `memberId`: `string`; \}, \{ `chatId`: `string`; `memberId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationDeleteChatMembershipInput.ts:5](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/MutationDeleteChatMembershipInput.ts#L5)
