[API Docs](/)

***

# Variable: mutationUpdatePostInputSchema

> `const` **mutationUpdatePostInputSchema**: `ZodPipe`\<`ZodObject`\<\{ `attachment`: `ZodOptional`\<`ZodAny`\>; `body`: `ZodOptional`\<`ZodString`\>; `caption`: `ZodOptional`\<`ZodString`\>; `id`: `ZodString`; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}, `$strip`\>, `ZodTransform`\<\{ `attachment`: `FileUpload` & `object` \| `null` \| `undefined`; `body?`: `string`; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}, \{ `attachment?`: `any`; `body?`: `string`; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}\>\>

Defined in: src/graphql/inputs/MutationUpdatePostInput.ts:11
