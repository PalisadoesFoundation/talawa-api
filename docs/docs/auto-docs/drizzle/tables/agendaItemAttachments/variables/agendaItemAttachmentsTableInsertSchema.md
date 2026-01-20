[API Docs](/)

***

# Variable: agendaItemAttachmentsTableInsertSchema

> `const` **agendaItemAttachmentsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `agendaItemId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `fileHash`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `mimeType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `objectName`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `fileHash`: (`schema`) => `ZodString`; `name`: (`schema`) => `ZodString`; `objectName`: (`schema`) => `ZodString`; \}\>

Defined in: src/drizzle/tables/agendaItemAttachments.ts:124
