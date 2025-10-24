[Admin Docs](/)

***

# Variable: mutationDeletePostVoteInputSchema

> `const` **mutationDeletePostVoteInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"postId"`\>, \{ `creatorId`: `ZodString`; \}\>, `"strip"`, `ZodTypeAny`, \{ `creatorId`: `string`; `postId`: `string`; \}, \{ `creatorId`: `string`; `postId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationDeletePostVoteInput.ts:5](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationDeletePostVoteInput.ts#L5)
