[Admin Docs](/)

***

# Variable: mutationCreatePostInputSchema

> `const` **mutationCreatePostInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `caption`: `ZodArray`\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<..., "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, `"many"`\>; \}, `"caption"`\>, \{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimetype`: `ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`, `"video/mp4"`, `"video/webm"`\]\>; `objectName`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `objectName`: `string`; \}, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `objectName`: `string`; \}\>, `"many"`\>\>; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}\>

Defined in: [src/graphql/inputs/MutationCreatePostInput.ts:41](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/graphql/inputs/MutationCreatePostInput.ts#L41)
