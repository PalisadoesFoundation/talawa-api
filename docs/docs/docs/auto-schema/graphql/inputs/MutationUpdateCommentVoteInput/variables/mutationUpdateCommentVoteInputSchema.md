[Admin Docs](/)

***

# Variable: mutationUpdateCommentVoteInputSchema

> `const` **mutationUpdateCommentVoteInputSchema**: `ZodObject`\<`Pick`\<\{ `commentId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"type"` \| `"commentId"`\>, `"strip"`, `ZodTypeAny`, \{ `commentId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}, \{ `commentId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateCommentVoteInput.ts:6](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/inputs/MutationUpdateCommentVoteInput.ts#L6)
