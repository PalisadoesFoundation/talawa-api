[Admin Docs](/)

***

# Variable: advertisementsTableInsertSchema

> `const` **advertisementsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `creatorId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `description`: `PgColumn`\<\{\}, \{\}, \{\}\>; `endAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `id`: `PgColumn`\<\{\}, \{\}, \{\}\>; `name`: `PgColumn`\<\{\}, \{\}, \{\}\>; `organizationId`: `PgColumn`\<\{\}, \{\}, \{\}\>; `startAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `type`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updatedAt`: `PgColumn`\<\{\}, \{\}, \{\}\>; `updaterId`: `PgColumn`\<\{\}, \{\}, \{\}\>; \}, \{ `endAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `name`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `organizationId`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `startAt`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; `type`: `ZodTypeAny` \| (`schema`) => `ZodTypeAny`; \}\>

Defined in: [src/drizzle/tables/advertisements.ts:148](https://github.com/PalisadoesFoundation/talawa-api/blob/a4f57b3a64e82c74809b195eb7bde9c04b2a5e89/src/drizzle/tables/advertisements.ts#L148)
