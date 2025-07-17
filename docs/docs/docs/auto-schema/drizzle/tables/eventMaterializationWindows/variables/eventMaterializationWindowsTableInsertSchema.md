[Admin Docs](/)

***

# Variable: eventMaterializationWindowsTableInsertSchema

> `const` **eventMaterializationWindowsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `configurationNotes`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdById`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `currentWindowEndDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `historyRetentionMonths`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `hotWindowMonthsAhead`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isEnabled`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastProcessedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastProcessedInstanceCount`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `lastUpdatedById`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `maxInstancesPerRun`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `processingPriority`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `retentionStartDate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `configurationNotes`: `ZodOptional`\<`ZodString`\>; `createdById`: `ZodString`; `currentWindowEndDate`: `ZodDate`; `historyRetentionMonths`: `ZodNumber`; `hotWindowMonthsAhead`: `ZodNumber`; `isEnabled`: `ZodOptional`\<`ZodBoolean`\>; `lastProcessedInstanceCount`: `ZodNumber`; `lastUpdatedById`: `ZodOptional`\<`ZodString`\>; `maxInstancesPerRun`: `ZodNumber`; `organizationId`: `ZodString`; `processingPriority`: `ZodNumber`; `retentionStartDate`: `ZodDate`; \}\>

Defined in: [src/drizzle/tables/eventMaterializationWindows.ts:232](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/drizzle/tables/eventMaterializationWindows.ts#L232)
