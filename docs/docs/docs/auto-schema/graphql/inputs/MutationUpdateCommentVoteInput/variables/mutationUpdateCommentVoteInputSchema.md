[Admin Docs](/)

***

# Variable: mutationUpdateCommentVoteInputSchema

> `const` **mutationUpdateCommentVoteInputSchema**: `ZodObject`\<`Pick`\<\{ `commentId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"type"` \| `"commentId"`\>, `"strip"`, `ZodTypeAny`, \{ `commentId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}, \{ `commentId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateCommentVoteInput.ts:6](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationUpdateCommentVoteInput.ts#L6)
