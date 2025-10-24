[Admin Docs](/)

***

# Variable: mutationCreatePostVoteInputSchema

> `const` **mutationCreatePostVoteInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"type"` \| `"postId"`\>, `"strip"`, `ZodTypeAny`, \{ `postId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}, \{ `postId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}\>

Defined in: [src/graphql/inputs/MutationCreatePostVoteInput.ts:6](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/graphql/inputs/MutationCreatePostVoteInput.ts#L6)
