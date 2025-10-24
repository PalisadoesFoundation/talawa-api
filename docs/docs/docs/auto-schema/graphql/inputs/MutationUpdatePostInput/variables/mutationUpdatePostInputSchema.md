[Admin Docs](/)

***

# Variable: mutationUpdatePostInputSchema

> `const` **mutationUpdatePostInputSchema**: `ZodEffects`\<`ZodObject`\<\{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimetype`: `ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`, `"video/mp4"`, `"video/webm"`\]\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}\>, `"many"`\>\>; `caption`: `ZodOptional`\<`ZodString`\>; `id`: `ZodString`; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `attachments?`: `object`[]; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}, \{ `attachments?`: `object`[]; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}\>, \{ `attachments?`: `object`[]; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}, \{ `attachments?`: `object`[]; `caption?`: `string`; `id`: `string`; `isPinned?`: `boolean`; \}\>

Defined in: [src/graphql/inputs/MutationUpdatePostInput.ts:9](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/inputs/MutationUpdatePostInput.ts#L9)
