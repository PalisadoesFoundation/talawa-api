[Admin Docs](/)

***

# Variable: recurrenceRulesTableInsertSchema

> `const` **recurrenceRulesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `baseRecurringEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byDay`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byMonth`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byMonthDay`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `count`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `frequency`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `interval`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `latestInstanceDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `originalSeriesId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceEndDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceRuleString`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceStartDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `byDay`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `byMonth`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `byMonthDay`: `ZodOptional`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>; `frequency`: `ZodEnum`\<\[`"DAILY"`, `"WEEKLY"`, `"MONTHLY"`, `"YEARLY"`\]\>; `interval`: (`schema`) => `ZodNumber`; `recurrenceRuleString`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/recurrenceRules.ts:241](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/drizzle/tables/recurrenceRules.ts#L241)
