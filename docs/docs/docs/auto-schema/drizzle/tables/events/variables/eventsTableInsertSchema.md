[Admin Docs](/)

***

# Variable: eventsTableInsertSchema

> `const` **eventsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `creatorId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `description`: `PgColumn`\<\{\}, \{\}, \{\}\>; `endAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `id`: `PgColumn`\<\{\}, \{\}, \{\}\>; `name`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `startAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updatedAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updaterId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, \{ `endAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `name`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `organizationId`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `startAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; \}\>

Defined in: [src/drizzle/tables/events.ts:151](https://github.com/PalisadoesFoundation/talawa-api/blob/37e2d6abe1cabaa02f97a3c6c418b81e8fcb5a13/src/drizzle/tables/events.ts#L151)
