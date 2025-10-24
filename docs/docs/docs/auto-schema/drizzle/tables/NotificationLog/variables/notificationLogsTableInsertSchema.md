[Admin Docs](/)

***

# Variable: notificationLogsTableInsertSchema

> `const` **notificationLogsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `channel`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `eventType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `navigation`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `renderedContent`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sender`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `status`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `templateId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `variables`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `channel`: (`schema`) => `ZodString`; `eventType`: (`schema`) => `ZodString`; `navigation`: (`schema`) => `ZodOptional`\<`ZodString`\>; `status`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/NotificationLog.ts:125](https://github.com/Sourya07/talawa-api/blob/2dc82649c98e5346c00cdf926fe1d0bc13ec1544/src/drizzle/tables/NotificationLog.ts#L125)
