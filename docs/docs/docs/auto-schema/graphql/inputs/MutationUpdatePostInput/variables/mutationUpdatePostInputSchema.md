[Admin Docs](/)

***

# Variable: mutationUpdatePostInputSchema

> `const` **mutationUpdatePostInputSchema**: `ZodEffects`\<`ZodObject`\<\{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimetype`: `ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`, `"video/mp4"`, `"video/webm"`\]\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}\>, `"many"`\>\>; `caption`: `ZodOptional`\<`ZodArray`\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<..., "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, `"many"`\>\>; `id`: `ZodString`; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `id`: `string`; `isPinned`: `boolean`; \}, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `id`: `string`; `isPinned`: `boolean`; \}\>, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `id`: `string`; `isPinned`: `boolean`; \}, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `id`: `string`; `isPinned`: `boolean`; \}\>

Defined in: src/graphql/inputs/MutationUpdatePostInput.ts:9
