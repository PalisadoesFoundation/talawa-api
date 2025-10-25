[Admin Docs](/)

***

# Variable: queryHasUserVotedInputSchema

> `const` **queryHasUserVotedInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"postId"`\>, `"strip"`, `ZodTypeAny`, \{ `postId`: `string`; \}, \{ `postId`: `string`; \}\>

Defined in: [src/graphql/inputs/QueryHasUserVotedInput.ts:5](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/graphql/inputs/QueryHasUserVotedInput.ts#L5)
