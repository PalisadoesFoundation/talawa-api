[**talawa-api**](../../../../README.md)

***

# Variable: fundsTableInsertSchema

> `const` **fundsTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `creatorId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isArchived`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isDefault`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `isTaxDeductible`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `organizationId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `referenceNumber`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `createdAt`: () => `ZodOptional`\<`ZodDate`\>; `creatorId`: () => `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: () => `ZodOptional`\<`ZodString`\>; `isArchived`: () => `ZodOptional`\<`ZodBoolean`\>; `isDefault`: () => `ZodOptional`\<`ZodBoolean`\>; `isTaxDeductible`: () => `ZodBoolean`; `name`: () => `ZodString`; `organizationId`: () => `ZodString`; `referenceNumber`: () => `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: () => `ZodOptional`\<`ZodDate`\>; `updaterId`: () => `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/funds.ts:138](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/funds.ts#L138)
