[API Docs](/)

***

# Variable: mutationUpdateCommentVoteInputSchema

> `const` **mutationUpdateCommentVoteInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `commentId`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"type"` \| `"commentId"`\>, \{ `type`: `ZodNullable`\<`ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `commentId`: `string`; `type`: `null` \| `"down_vote"` \| `"up_vote"`; \}, \{ `commentId`: `string`; `type`: `null` \| `"down_vote"` \| `"up_vote"`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateCommentVoteInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationUpdateCommentVoteInput.ts#L6)
