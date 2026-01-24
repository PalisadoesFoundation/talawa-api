[**talawa-api**](../../../../README.md)

***

# Variable: mutationUpdatePostInputSchema

> `const` **mutationUpdatePostInputSchema**: `ZodPipe`\<`ZodObject`\<\{ `attachment`: `ZodOptional`\<`ZodAny`\>; `body`: `ZodOptional`\<`ZodString`\>; `caption`: `ZodOptional`\<`ZodString`\>; `id`: `ZodString`; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}, `$strip`\>, `ZodTransform`\<\{ `attachment`: `FileUpload` & `object` \| `null` \| `undefined`; `body?`: `string`; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}, \{ `attachment?`: `any`; `body?`: `string`; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}\>\>

Defined in: [src/graphql/inputs/MutationUpdatePostInput.ts:11](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/inputs/MutationUpdatePostInput.ts#L11)
