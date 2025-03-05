[Admin Docs](/)

***

# Variable: mutationCreatePostInputSchema

> `const` **mutationCreatePostInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `caption`: `ZodArray`\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<..., "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, `"many"`\>; \}, `"caption"`\>, \{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodType`\<`Promise`\<`FileUpload`\>, `ZodTypeDef`, `Promise`\<`FileUpload`\>\>, `"many"`\>\>; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `attachments`: `Promise`\<`FileUpload`\>[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}, \{ `attachments`: `Promise`\<`FileUpload`\>[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}\>

Defined in: [src/graphql/inputs/MutationCreatePostInput.ts:6](https://github.com/PalisadoesFoundation/talawa-api/blob/be5955174726b793a9d0896706e81c3e939858bf/src/graphql/inputs/MutationCreatePostInput.ts#L6)
