[Admin Docs](/)

***

# Variable: mutationUpdateChatMembershipInputSchema

> `const` **mutationUpdateChatMembershipInputSchema**: `ZodObject`\<`Pick`\<\{ `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `lastReadAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `memberId`: `ZodString`; `role`: `ZodEnum`\<\[`"administrator"`, `"regular"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"role"` \| `"chatId"` \| `"memberId"`\>, `"strip"`, `ZodTypeAny`, \{ `chatId`: `string`; `memberId`: `string`; `role`: `"administrator"` \| `"regular"`; \}, \{ `chatId`: `string`; `memberId`: `string`; `role`: `"administrator"` \| `"regular"`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateChatMembershipInput.ts:6](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationUpdateChatMembershipInput.ts#L6)
