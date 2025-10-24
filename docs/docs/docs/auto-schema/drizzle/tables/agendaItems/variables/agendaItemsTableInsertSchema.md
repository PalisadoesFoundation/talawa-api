[Admin Docs](/)

***

# Variable: agendaItemsTableInsertSchema

> `const` **agendaItemsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `description`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `duration`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `folderId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `key`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `type`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `description`: (`schema`) => `ZodOptional`\<`ZodString`\>; `name`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/agendaItems.ts:124](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/drizzle/tables/agendaItems.ts#L124)
