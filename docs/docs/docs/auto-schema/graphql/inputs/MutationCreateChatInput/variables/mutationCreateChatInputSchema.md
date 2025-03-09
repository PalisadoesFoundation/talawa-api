[Admin Docs](/)

***

# Variable: mutationCreateChatInputSchema

> `const` **mutationCreateChatInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; `organizationId`: `ZodTypeAny`; \}, `"name"` \| `"organizationId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar`: `Promise`\<`FileUpload`\>; `name`: `any`; `organizationId`: `any`; \}, \{ `avatar`: `Promise`\<`FileUpload`\>; `name`: `any`; `organizationId`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/blob/1251c45d69620e1317cb8632c6decbdb7edbdb06/src/graphql/inputs/MutationCreateChatInput.ts#L6)
