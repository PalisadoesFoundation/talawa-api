[API Docs](/)

***

# Variable: mutationUpdateChatInputSchema

> `const` **mutationUpdateChatInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Pick`\<\{ `avatarMimeType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`\]\>\>\>; `avatarName`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `organizationId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"description"`\>, \{ `avatar`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `id`: `ZodString`; `name`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `avatar?`: `null` \| `Promise`\<`FileUpload`\>; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}, \{ `avatar?`: `null` \| `Promise`\<`FileUpload`\>; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}\>, \{ `avatar?`: `null` \| `Promise`\<`FileUpload`\>; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}, \{ `avatar?`: `null` \| `Promise`\<`FileUpload`\>; `description?`: `null` \| `string`; `id`: `string`; `name?`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationUpdateChatInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationUpdateChatInput.ts#L6)
