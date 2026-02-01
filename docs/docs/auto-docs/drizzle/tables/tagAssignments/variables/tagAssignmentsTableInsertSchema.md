[API Docs](/)

***

# Variable: tagAssignmentsTableInsertSchema

> `const` **tagAssignmentsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `assigneeId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `tagId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `assigneeId`: () => `ZodString`; `creatorId`: () => `ZodString`; `tagId`: () => `ZodString`; \}, `undefined`\>

Defined in: [src/drizzle/tables/tagAssignments.ts:54](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/tagAssignments.ts#L54)
