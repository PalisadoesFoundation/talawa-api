[API Docs](/)

***

# Variable: mutationUpdatePostVoteInputSchema

> `const` **mutationUpdatePostVoteInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"type"` \| `"postId"`\>, \{ `type`: `ZodNullable`\<`ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `postId`: `string`; `type`: `null` \| `"down_vote"` \| `"up_vote"`; \}, \{ `postId`: `string`; `type`: `null` \| `"down_vote"` \| `"up_vote"`; \}\>

Defined in: [src/graphql/inputs/MutationUpdatePostVoteInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationUpdatePostVoteInput.ts#L6)
