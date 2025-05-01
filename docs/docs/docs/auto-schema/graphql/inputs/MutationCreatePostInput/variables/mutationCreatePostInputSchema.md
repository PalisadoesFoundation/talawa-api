[Admin Docs](/)

***

# Variable: mutationCreatePostInputSchema

> `const` **mutationCreatePostInputSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `caption`: `ZodArray`\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<ZodArray\<..., "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, "many"\>, `"many"`\>; \}, `"caption"`\>, \{ `attachments`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fileHash`: `ZodString`; `mimetype`: `ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`, `"video/mp4"`, `"video/webm"`\]\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}, \{ `fileHash`: `string`; `mimetype`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name`: `string`; `objectName`: `string`; \}\>, `"many"`\>\>; `isPinned`: `ZodOptional`\<`ZodBoolean`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}, \{ `attachments`: `object`[]; `caption`: `unknown`[]; `isPinned`: `boolean`; \}\>

Defined in: [src/graphql/inputs/MutationCreatePostInput.ts:49](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/graphql/inputs/MutationCreatePostInput.ts#L49)
