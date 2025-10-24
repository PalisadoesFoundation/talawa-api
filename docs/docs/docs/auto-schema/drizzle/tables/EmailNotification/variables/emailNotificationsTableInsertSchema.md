[Admin Docs](/)

***

# Variable: emailNotificationsTableInsertSchema

> `const` **emailNotificationsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `email`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `errorMessage`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `failedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `htmlBody`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `maxRetries`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `notificationLogId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `retryCount`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sentAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sesMessageId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `status`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `subject`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `userId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `email`: (`schema`) => `ZodString`; `htmlBody`: (`schema`) => `ZodString`; `maxRetries`: (`schema`) => `ZodOptional`\<`ZodNumber`\>; `retryCount`: (`schema`) => `ZodOptional`\<`ZodNumber`\>; `status`: (`schema`) => `ZodOptional`\<`ZodEnum`\<\[`"pending"`, `"sent"`, `"delivered"`, `"bounced"`, `"failed"`\]\>\>; `subject`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/EmailNotification.ts:165](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/drizzle/tables/EmailNotification.ts#L165)
