[API Docs](/)

***

# Variable: recurringEventExceptionsTableInsertSchema

> `const` **recurringEventExceptionsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `exceptionData`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurringEventInstanceId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `creatorId`: `ZodString`; `exceptionData`: `ZodRecord`\<`ZodAny`, `SomeType`\>; `organizationId`: `ZodString`; `recurringEventInstanceId`: `ZodString`; `updaterId`: `ZodOptional`\<`ZodString`\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/recurringEventExceptions.ts:152](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurringEventExceptions.ts#L152)
