[Admin Docs](/)

***

# Variable: eventExceptionsTableInsertSchema

> `const` **eventExceptionsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `eventInstanceId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `exceptionData`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `exceptionType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `instanceStartTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurringEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `exceptionData`: `ZodRecord`\<`ZodString`, `ZodAny`\>; `instanceStartTime`: `ZodDate`; \}\>

Defined in: [src/drizzle/tables/eventExceptions.ts:208](https://github.com/gautam-divyanshu/talawa-api/blob/a895c36f24acf725ac16aa7e0f8e50ef9fa64c42/src/drizzle/tables/eventExceptions.ts#L208)
