[Admin Docs](/)

***

# Variable: notificationLogsTableInsertSchema

> `const` **notificationLogsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `channel`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `eventType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `navigation`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `renderedContent`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sender`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `status`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `templateId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `variables`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `channel`: (`schema`) => `ZodString`; `eventType`: (`schema`) => `ZodString`; `navigation`: (`schema`) => `ZodOptional`\<`ZodString`\>; `status`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:125](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/drizzle/tables/NotificationLog.ts#L125)
