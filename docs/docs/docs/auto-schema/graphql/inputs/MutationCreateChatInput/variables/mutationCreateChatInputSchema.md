[Admin Docs](/)

***

# Variable: mutationCreateChatInputSchema

> `const` **mutationCreateChatInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; `organizationId`: `ZodTypeAny`; \}, `"name"` \| `"organizationId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `name`: `any`; `organizationId`: `any`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `name`: `any`; `organizationId`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/graphql/inputs/MutationCreateChatInput.ts#L6)
