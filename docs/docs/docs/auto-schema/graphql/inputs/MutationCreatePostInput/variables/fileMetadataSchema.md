[Admin Docs](/)

***

# Variable: fileMetadataSchema

> `const` **fileMetadataSchema**: `ZodObject`\<\{ `fileHash`: `ZodString`; `mimetype`: `ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`, `"video/mp4"`, `"video/webm"`\]\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fileHash?`: `string`; `mimetype?`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name?`: `string`; `objectName?`: `string`; \}, \{ `fileHash?`: `string`; `mimetype?`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"`; `name?`: `string`; `objectName?`: `string`; \}\>

Defined in: src/graphql/inputs/MutationCreatePostInput.ts:42
