[Admin Docs](/)

***

# Variable: mutationCreateChatMembershipInputSchema

> `const` **mutationCreateChatMembershipInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `chatId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `lastReadAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `memberId`: `ZodString`; `role`: `ZodEnum`\<\[`"administrator"`, `"regular"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"chatId"` \| `"memberId"`\>, \{ `role`: `ZodOptional`\<`ZodEnum`\<\[`"administrator"`, `"regular"`\]\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `chatId`: `string`; `memberId`: `string`; `role?`: `"administrator"` \| `"regular"`; \}, \{ `chatId`: `string`; `memberId`: `string`; `role?`: `"administrator"` \| `"regular"`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatMembershipInput.ts:6](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationCreateChatMembershipInput.ts#L6)
