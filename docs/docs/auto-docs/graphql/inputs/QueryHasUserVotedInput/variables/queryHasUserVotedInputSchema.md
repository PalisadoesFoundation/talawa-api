[API Docs](/)

***

# Variable: queryHasUserVotedInputSchema

> `const` **queryHasUserVotedInputSchema**: `ZodObject`\<`Pick`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `type`: `ZodEnum`\<\[`"down_vote"`, `"up_vote"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"postId"`\>, `"strip"`, `ZodTypeAny`, \{ `postId`: `string`; \}, \{ `postId`: `string`; \}\>

Defined in: src/graphql/inputs/QueryHasUserVotedInput.ts:5
