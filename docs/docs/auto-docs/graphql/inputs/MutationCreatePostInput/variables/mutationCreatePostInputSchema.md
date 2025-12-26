[API Docs](/)

***

# Variable: mutationCreatePostInputSchema

> `const` **mutationCreatePostInputSchema**: `ZodEffects`\<`ZodObject`\<`Pick`\<\{ `body`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `caption`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `creatorId`: `ZodString`; `id`: `ZodOptional`\<`ZodString`\>; `organizationId`: `ZodString`; `pinnedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updatedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `updaterId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"organizationId"`\> & `object`, `"strip"`, `ZodTypeAny`, \{ `attachment?`: `any`; `body?`: `string`; `caption`: `string`; `isPinned?`: `boolean`; `organizationId`: `string`; \}, \{ `attachment?`: `any`; `body?`: `string`; `caption`: `string`; `isPinned?`: `boolean`; `organizationId`: `string`; \}\>, \{ `attachment`: `FileUpload` & `object` \| `null` \| `undefined`; `body?`: `string`; `caption`: `string`; `isPinned?`: `boolean`; `organizationId`: `string`; \}, \{ `attachment?`: `any`; `body?`: `string`; `caption`: `string`; `isPinned?`: `boolean`; `organizationId`: `string`; \}\>

Defined in: [src/graphql/inputs/MutationCreatePostInput.ts:12](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/inputs/MutationCreatePostInput.ts#L12)
