[Admin Docs](/)

***

# Variable: notificationLogsTableInsertSchema

> `const` **notificationLogsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `channel`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `eventType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `navigation`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `renderedContent`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sender`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `status`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `templateId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `variables`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `channel`: (`schema`) => `ZodString`; `eventType`: (`schema`) => `ZodString`; `navigation`: (`schema`) => `ZodOptional`\<`ZodString`\>; `status`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:125](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/drizzle/tables/NotificationLog.ts#L125)
