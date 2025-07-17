[Admin Docs](/)

***

# Variable: materializedEventInstancesTableInsertSchema

> `const` **materializedEventInstancesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `actualEndTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `actualStartTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `baseRecurringEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isCancelled`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastUpdatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `materializedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `originalInstanceStartTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceRuleId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sequenceNumber`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `totalCount`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `version`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `actualEndTime`: `ZodDate`; `actualStartTime`: `ZodDate`; `baseRecurringEventId`: `ZodString`; `isCancelled`: `ZodOptional`\<`ZodBoolean`\>; `organizationId`: `ZodString`; `originalInstanceStartTime`: `ZodDate`; `recurrenceRuleId`: `ZodString`; `sequenceNumber`: `ZodNumber`; `totalCount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `version`: `ZodOptional`\<`ZodString`\>; \}\>

Defined in: [src/drizzle/tables/materializedEventInstances.ts:276](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/drizzle/tables/materializedEventInstances.ts#L276)
