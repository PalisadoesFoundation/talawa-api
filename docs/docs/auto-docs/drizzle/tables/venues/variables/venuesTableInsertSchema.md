[API Docs](/)

***

# Variable: venuesTableInsertSchema

> `const` **venuesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `capacity`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `description`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `capacity`: (`schema`) => `ZodOptional`\<`ZodNullable`\<`ZodInt`\>\>; `creatorId`: (`schema`) => `ZodOptional`\<`ZodNullable`\<`ZodUUID`\>\>; `description`: (`schema`) => `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: (`schema`) => `ZodString`; `updaterId`: (`schema`) => `ZodOptional`\<`ZodNullable`\<`ZodUUID`\>\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/venues.ts:135](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/venues.ts#L135)
