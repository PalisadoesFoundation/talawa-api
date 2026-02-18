[API Docs](/)

***

# Variable: eventAttachmentsTableInsertSchema

> `const` **eventAttachmentsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `eventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `mimeType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `mimeType`: () => `ZodEnum`\<\{ `image/avif`: `"image/avif"`; `image/jpeg`: `"image/jpeg"`; `image/png`: `"image/png"`; `image/webp`: `"image/webp"`; `video/mp4`: `"video/mp4"`; `video/webm`: `"video/webm"`; \}\>; `name`: (`schema`) => `ZodString`; \}, `undefined`\>

Defined in: src/drizzle/tables/eventAttachments.ts:121
