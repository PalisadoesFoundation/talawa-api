[Admin Docs](/)

***

# Variable: mutationCreateCommentInputSchema

> `const` **mutationCreateCommentInputSchema**: `ZodObject`\<`Pick`\<\{ `body`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `postId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; \}, `"body"` \| `"postId"`\>, `"strip"`, `ZodTypeAny`, \{ `body`: `string`; `postId`: `string`; \}, \{ `body`: `string`; `postId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateCommentInput.ts:5](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/graphql/inputs/MutationCreateCommentInput.ts#L5)
