[Admin Docs](/)

***

# Variable: mutationCreateChatInputSchema

> `const` **mutationCreateChatInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `name`: `ZodTypeAny`; `organizationId`: `ZodTypeAny`; \}, `"name"` \| `"organizationId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar?`: `Promise`\<`FileUpload`\>; `name?`: `any`; `organizationId?`: `any`; \}, \{ `avatar?`: `Promise`\<`FileUpload`\>; `name?`: `any`; `organizationId?`: `any`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/blob/a4f57b3a64e82c74809b195eb7bde9c04b2a5e89/src/graphql/inputs/MutationCreateChatInput.ts#L6)
