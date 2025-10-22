[Admin Docs](/)

***

# Variable: mutationDeletePostVoteInputSchema

> `const` **mutationDeletePostVoteInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"postId"`\>, \{ `creatorId`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `creatorId`: `string`; `postId`: `string`; \}, \{ `creatorId`: `string`; `postId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationDeletePostVoteInput.ts:5](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/inputs/MutationDeletePostVoteInput.ts#L5)
