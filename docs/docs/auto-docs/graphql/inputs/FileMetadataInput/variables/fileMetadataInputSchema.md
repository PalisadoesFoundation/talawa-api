[**talawa-api**](../../../../README.md)

***

# Variable: fileMetadataInputSchema

> `const` **fileMetadataInputSchema**: `ZodObject`\<\{ `fileHash`: `ZodString`; `mimeType`: `ZodEnum`\<\[`"image/avif"`, `"image/jpeg"`, `"image/png"`, `"image/webp"`, `"video/mp4"`, `"video/webm"`, `"video/quicktime"`\]\>; `name`: `ZodString`; `objectName`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fileHash`: `string`; `mimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"` \| `"video/quicktime"`; `name`: `string`; `objectName`: `string`; \}, \{ `fileHash`: `string`; `mimeType`: `"image/avif"` \| `"image/jpeg"` \| `"image/png"` \| `"image/webp"` \| `"video/mp4"` \| `"video/webm"` \| `"video/quicktime"`; `name`: `string`; `objectName`: `string`; \}\>

Defined in: src/graphql/inputs/FileMetadataInput.ts:9

Zod schema for validating file metadata input submitted after MinIO presigned URL upload.
