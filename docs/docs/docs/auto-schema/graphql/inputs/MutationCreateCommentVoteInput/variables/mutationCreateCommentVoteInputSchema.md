[Admin Docs](/)

***

# Variable: mutationCreateCommentVoteInputSchema

> `const` **mutationCreateCommentVoteInputSchema**: `ZodObject`\<`Pick`\<\{ `commentId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"type"` \| `"commentId"`\>, `"strip"`, `ZodTypeAny`, \{ `commentId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}, \{ `commentId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}\>

Defined in: [src/graphql/inputs/MutationCreateCommentVoteInput.ts:6](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/graphql/inputs/MutationCreateCommentVoteInput.ts#L6)
