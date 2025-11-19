[API Docs](/)

***

# Variable: eventGenerationWindowsTableInsertSchema

> `const` **eventGenerationWindowsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `configurationNotes`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdById`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `currentWindowEndDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `historyRetentionMonths`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `hotWindowMonthsAhead`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isEnabled`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastProcessedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastProcessedInstanceCount`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastUpdatedById`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `maxInstancesPerRun`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `processingPriority`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `retentionStartDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `configurationNotes`: `ZodOptional`\<`ZodString`\>; `createdById`: `ZodString`; `currentWindowEndDate`: `ZodDate`; `historyRetentionMonths`: `ZodNumber`; `hotWindowMonthsAhead`: `ZodNumber`; `isEnabled`: `ZodOptional`\<`ZodBoolean`\>; `lastProcessedInstanceCount`: `ZodNumber`; `lastUpdatedById`: `ZodOptional`\<`ZodString`\>; `maxInstancesPerRun`: `ZodNumber`; `organizationId`: `ZodString`; `processingPriority`: `ZodNumber`; `retentionStartDate`: `ZodDate`; \}\>

Defined in: src/drizzle/tables/eventGenerationWindows.ts:231
