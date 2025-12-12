[API Docs](/)

***

# Variable: mutationCreateCommentInputSchema

> `const` **mutationCreateCommentInputSchema**: `ZodObject`\<`Pick`\<\{ `body`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"body"` \| `"postId"`\>, `"strip"`, `ZodTypeAny`, \{ `body`: `string`; `postId`: `string`; \}, \{ `body`: `string`; `postId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateCommentInput.ts:5](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateCommentInput.ts#L5)
