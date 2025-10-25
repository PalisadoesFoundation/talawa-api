[Admin Docs](/)

***

# Variable: organizationsTableInsertSchema

> `const` **organizationsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `addressLine1`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `addressLine2`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `avatarMimeType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `avatarName`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `city`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `countryCode`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `description`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `postalCode`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `state`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `userRegistrationRequired`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `addressLine1`: (`schema`) => `ZodOptional`\<`ZodString`\>; `addressLine2`: (`schema`) => `ZodOptional`\<`ZodString`\>; `avatarName`: (`schema`) => `ZodOptional`\<`ZodString`\>; `city`: (`schema`) => `ZodOptional`\<`ZodString`\>; `description`: (`schema`) => `ZodOptional`\<`ZodString`\>; `name`: (`schema`) => `ZodString`; `postalCode`: (`schema`) => `ZodOptional`\<`ZodString`\>; `state`: (`schema`) => `ZodOptional`\<`ZodString`\>; `userRegistrationRequired`: (`schema`) => `ZodOptional`\<`ZodBoolean`\>; \}\>

Defined in: [src/drizzle/tables/organizations.ts:224](https://github.com/Sourya07/talawa-api/blob/cfbd515d04ffba748b09232a33807f1845dd1878/src/drizzle/tables/organizations.ts#L224)
