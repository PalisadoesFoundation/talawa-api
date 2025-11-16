[API Docs](/)

***

# Variable: mutationCreateChatInputSchema

> `const` **mutationCreateChatInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `avatarMimeType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`\]\>\>\>; `avatarName`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"description"` \| `"name"` \| `"organizationId"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar?`: `null` \| `Promise`\<`FileUpload`\>; `description?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; \}, \{ `avatar?`: `null` \| `Promise`\<`FileUpload`\>; `description?`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreateChatInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreateChatInput.ts#L6)
