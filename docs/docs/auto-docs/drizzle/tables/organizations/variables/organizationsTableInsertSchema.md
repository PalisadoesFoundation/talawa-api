[API Docs](/)

***

# Variable: organizationsTableInsertSchema

> `const` **organizationsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `addressLine1`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `addressLine2`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `avatarMimeType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `avatarName`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `city`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `countryCode`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `description`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `postalCode`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `state`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `userRegistrationRequired`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `addressLine1`: (`schema`) => `ZodOptional`\<`ZodString`\>; `addressLine2`: (`schema`) => `ZodOptional`\<`ZodString`\>; `avatarName`: (`schema`) => `ZodOptional`\<`ZodString`\>; `city`: (`schema`) => `ZodOptional`\<`ZodString`\>; `description`: (`schema`) => `ZodOptional`\<`ZodString`\>; `name`: (`schema`) => `ZodString`; `postalCode`: (`schema`) => `ZodOptional`\<`ZodString`\>; `state`: (`schema`) => `ZodOptional`\<`ZodString`\>; `userRegistrationRequired`: (`schema`) => `ZodOptional`\<`ZodBoolean`\>; \}\>

Defined in: [src/drizzle/tables/organizations.ts:224](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/organizations.ts#L224)
