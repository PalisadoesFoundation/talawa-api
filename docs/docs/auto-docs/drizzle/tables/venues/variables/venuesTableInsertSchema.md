[API Docs](/)

***

# Variable: venuesTableInsertSchema

> `const` **venuesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `capacity`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `description`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `capacity`: () => `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `creatorId`: () => `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `description`: () => `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: () => `ZodOptional`\<`ZodString`\>; `name`: () => `ZodString`; `organizationId`: () => `ZodString`; `updaterId`: () => `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/venues.ts:136](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/venues.ts#L136)
