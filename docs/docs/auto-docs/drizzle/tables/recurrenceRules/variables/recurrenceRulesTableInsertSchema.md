[API Docs](/)

***

# Variable: recurrenceRulesTableInsertSchema

> `const` **recurrenceRulesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `baseRecurringEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byDay`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byMonth`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byMonthDay`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `count`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `frequency`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `interval`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `latestInstanceDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `originalSeriesId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceEndDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceRuleString`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceStartDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `byDay`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `byMonth`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `byMonthDay`: `ZodOptional`\<`ZodArray`\<`ZodEffects`\<`ZodNumber`, `number`, `number`\>, `"many"`\>\>; `frequency`: `ZodEnum`\<\[`"DAILY"`, `"WEEKLY"`, `"MONTHLY"`, `"YEARLY"`\]\>; `interval`: (`schema`) => `ZodNumber`; `recurrenceRuleString`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/recurrenceRules.ts:241](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/recurrenceRules.ts#L241)
