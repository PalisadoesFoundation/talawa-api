[Admin Docs](/)

***

# Variable: mutationCreatePostInputSchema

> `const` **mutationCreatePostInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `caption`: `ZodArray`\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<..., "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, `"many"`\>; \}, `"caption"`\>, \{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimetype`: `ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`, `"video/mp4"`, `"video/webm"`\]\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}\>, `"many"`\>\>; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}\>

Defined in: [src/graphql/inputs/MutationCreatePostInput.ts:49](https://github.com/PalisadoesFoundation/talawa-api/blob/a4f57b3a64e82c74809b195eb7bde9c04b2a5e89/src/graphql/inputs/MutationCreatePostInput.ts#L49)
