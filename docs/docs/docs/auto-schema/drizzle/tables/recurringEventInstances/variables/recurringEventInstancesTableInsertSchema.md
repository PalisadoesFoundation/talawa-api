[Admin Docs](/)

***

# Variable: recurringEventInstancesTableInsertSchema

> `const` **recurringEventInstancesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `actualEndTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `actualStartTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `baseRecurringEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `generatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isCancelled`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastUpdatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `originalInstanceStartTime`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `originalSeriesId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceRuleId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sequenceNumber`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `totalCount`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `version`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `actualEndTime`: `ZodDate`; `actualStartTime`: `ZodDate`; `baseRecurringEventId`: `ZodString`; `isCancelled`: `ZodOptional`\<`ZodBoolean`\>; `organizationId`: `ZodString`; `originalInstanceStartTime`: `ZodDate`; `originalSeriesId`: `ZodString`; `recurrenceRuleId`: `ZodString`; `sequenceNumber`: `ZodNumber`; `totalCount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `version`: `ZodOptional`\<`ZodString`\>; \}\>

Defined in: [src/drizzle/tables/recurringEventInstances.ts:277](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/drizzle/tables/recurringEventInstances.ts#L277)
