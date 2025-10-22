[Admin Docs](/)

***

# Variable: mutationCreatePostVoteInputSchema

> `const` **mutationCreatePostVoteInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"type"` \| `"postId"`\>, `"strip"`, `ZodTypeAny`, \{ `postId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}, \{ `postId`: `string`; `type`: `"down_vote"` \| `"up_vote"`; \}\>

Defined in: [src/graphql/inputs/MutationCreatePostVoteInput.ts:6](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/inputs/MutationCreatePostVoteInput.ts#L6)
