[Admin Docs](/)

***

# Variable: mutationDeleteCommentVoteInputSchema

> `const` **mutationDeleteCommentVoteInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `commentId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"commentId"`\>, \{ `creatorId`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `commentId`: `string`; `creatorId`: `string`; \}, \{ `commentId`: `string`; `creatorId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationDeleteCommentVoteInput.ts:5](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/inputs/MutationDeleteCommentVoteInput.ts#L5)
