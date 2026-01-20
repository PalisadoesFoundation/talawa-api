[API Docs](/)

***

# Variable: emailVerificationTokensTableInsertSchema

> `const` **emailVerificationTokensTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `expiresAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `tokenHash`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `usedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `userId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `expiresAt`: (`schema`) => `ZodDate`; `tokenHash`: (`schema`) => `ZodString`; `userId`: (`schema`) => `ZodString`; \}\>

Defined in: src/drizzle/tables/emailVerificationTokens.ts:73
