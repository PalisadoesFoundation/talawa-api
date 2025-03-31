[Admin Docs](/)

***

# Variable: mutationUpdateCommunityInputSchema

> `const` **mutationUpdateCommunityInputSchema**: `ZodEffects`\<`ZodObject`\<`extendShape`\<`Omit`\<\{ `name`: `ZodTypeAny`; \}, `"id"` \| `"createdAt"` \| `"name"` \| `"updatedAt"` \| `"updaterId"` \| `"logoMimeType"` \| `"logoName"`\>, \{ `logo`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>\>\>; `name`: `ZodOptional`\<`ZodTypeAny`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `logo`: `Promise`\<`FileUpload`\>; `name`: `any`; \}, \{ `logo`: `Promise`\<`FileUpload`\>; `name`: `any`; \}\>, \{ `logo`: `Promise`\<`FileUpload`\>; `name`: `any`; \}, \{ `logo`: `Promise`\<`FileUpload`\>; `name`: `any`; \}\>

Defined in: src/graphql/inputs/MutationUpdateCommunityInput.ts:6
