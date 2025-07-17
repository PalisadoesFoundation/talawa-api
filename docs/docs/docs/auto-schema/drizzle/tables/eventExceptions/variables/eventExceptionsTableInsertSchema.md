[Admin Docs](/)

***

# Variable: eventExceptionsTableInsertSchema

> `const` **eventExceptionsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `eventInstanceId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `exceptionData`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `exceptionType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `instanceStartTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurringEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `exceptionData`: `ZodRecord`\<`ZodString`, `ZodAny`\>; `instanceStartTime`: `ZodDate`; \}\>

Defined in: [src/drizzle/tables/eventExceptions.ts:208](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/drizzle/tables/eventExceptions.ts#L208)
