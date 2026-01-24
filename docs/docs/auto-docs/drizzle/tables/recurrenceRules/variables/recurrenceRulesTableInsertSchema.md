[**talawa-api**](../../../../README.md)

***

# Variable: recurrenceRulesTableInsertSchema

> `const` **recurrenceRulesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `baseRecurringEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byDay`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byMonth`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `byMonthDay`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `count`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `frequency`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `interval`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `latestInstanceDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `originalSeriesId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceEndDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceRuleString`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `recurrenceStartDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `byDay`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `byMonth`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `byMonthDay`: `ZodOptional`\<`ZodArray`\<`ZodNumber`\>\>; `frequency`: `ZodEnum`\<\{ `DAILY`: `"DAILY"`; `MONTHLY`: `"MONTHLY"`; `WEEKLY`: `"WEEKLY"`; `YEARLY`: `"YEARLY"`; \}\>; `interval`: (`schema`) => `ZodInt`; `recurrenceRuleString`: (`schema`) => `ZodString`; \}, `undefined`\>

Defined in: [src/drizzle/tables/recurrenceRules.ts:241](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/recurrenceRules.ts#L241)
