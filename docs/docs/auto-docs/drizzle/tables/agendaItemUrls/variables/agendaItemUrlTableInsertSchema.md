[**talawa-api**](../../../../README.md)

***

# Variable: agendaItemUrlTableInsertSchema

> `const` **agendaItemUrlTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `agendaItemId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `url`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `agendaItemId`: `ZodString`; `creatorId`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `updaterId`: `ZodNullable`\<`ZodOptional`\<`ZodString`\>\>; `url`: (`schema`) => `ZodString`; \}, `undefined`\>

Defined in: [src/drizzle/tables/agendaItemUrls.ts:111](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/agendaItemUrls.ts#L111)
