[Admin Docs](/)

***

# Variable: eventsTableInsertSchema

> `const` **eventsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `creatorId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `description`: `PgColumn`\<\{\}, \{\}, \{\}\>; `endAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `id`: `PgColumn`\<\{\}, \{\}, \{\}\>; `name`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `startAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updatedAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updaterId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, \{ `endAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `name`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `organizationId`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `startAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; \}\>

Defined in: [src/drizzle/tables/events.ts:151](https://github.com/hustlernik/talawa-api/blob/6321c91e956d2ee44b2bb9c22c1b40aa4687c9c2/src/drizzle/tables/events.ts#L151)
