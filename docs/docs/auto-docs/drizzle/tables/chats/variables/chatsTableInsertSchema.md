[API Docs](/)

***

# Variable: chatsTableInsertSchema

> `const` **chatsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `avatarMimeType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `avatarName`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `description`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `avatarName`: (`schema`) => `ZodOptional`\<`ZodString`\>; `description`: (`schema`) => `ZodOptional`\<`ZodString`\>; `name`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/chats.ts:130](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/chats.ts#L130)
