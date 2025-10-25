[Admin Docs](/)

***

# Variable: eventsTableInsertSchema

> `const` **eventsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `allDay`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `description`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `endAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isPublic`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isRecurringEventTemplate`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isRegisterable`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `location`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `startAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `allDay`: (`schema`) => `ZodOptional`\<`ZodBoolean`\>; `description`: (`schema`) => `ZodOptional`\<`ZodString`\>; `isPublic`: (`schema`) => `ZodOptional`\<`ZodBoolean`\>; `isRecurringEventTemplate`: `ZodOptional`\<`ZodBoolean`\>; `isRegisterable`: (`schema`) => `ZodOptional`\<`ZodBoolean`\>; `location`: (`schema`) => `ZodOptional`\<`ZodString`\>; `name`: (`schema`) => `ZodString`; \}\>

Defined in: [src/drizzle/tables/events.ts:191](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/drizzle/tables/events.ts#L191)
