[Admin Docs](/)

***

# Variable: eventsTableInsertSchema

> `const` **eventsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `creatorId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `description`: `PgColumn`\<\{\}, \{\}, \{\}\>; `endAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `id`: `PgColumn`\<\{\}, \{\}, \{\}\>; `name`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `startAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updatedAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updaterId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, \{ `endAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `name`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `organizationId`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `startAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; \}\>

Defined in: [src/drizzle/tables/events.ts:151](https://github.com/PalisadoesFoundation/talawa-api/blob/ba7157ff8b26bc2c54d7ad9ad4d0db0ff21eda4d/src/drizzle/tables/events.ts#L151)
