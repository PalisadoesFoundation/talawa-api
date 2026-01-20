[API Docs](/)

***

# Variable: blockedUsersTableInsertSchema

> `const` **blockedUsersTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `userId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `organizationId`: (`schema`) => `ZodUUID`; `userId`: (`schema`) => `ZodUUID`; \}, `undefined`\>

Defined in: src/drizzle/tables/blockedUsers.ts:58
