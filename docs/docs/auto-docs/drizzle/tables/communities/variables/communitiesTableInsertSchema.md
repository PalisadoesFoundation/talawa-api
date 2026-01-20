[API Docs](/)

***

# Variable: communitiesTableInsertSchema

> `const` **communitiesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `facebookURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `githubURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `inactivityTimeoutDuration`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `instagramURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `linkedinURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `logoMimeType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `logoName`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `redditURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `slackURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `websiteURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `xURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `youtubeURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `facebookURL`: () => `ZodOptional`\<`ZodString`\>; `githubURL`: () => `ZodOptional`\<`ZodString`\>; `inactivityTimeoutDuration`: (`schema`) => `ZodOptional`\<`ZodNumber`\>; `instagramURL`: () => `ZodOptional`\<`ZodString`\>; `linkedinURL`: () => `ZodOptional`\<`ZodString`\>; `logoName`: (`schema`) => `ZodOptional`\<`ZodString`\>; `name`: (`schema`) => `ZodString`; `redditURL`: () => `ZodOptional`\<`ZodString`\>; `slackURL`: () => `ZodOptional`\<`ZodString`\>; `websiteURL`: () => `ZodOptional`\<`ZodString`\>; `xURL`: () => `ZodOptional`\<`ZodString`\>; `youtubeURL`: () => `ZodOptional`\<`ZodString`\>; \}\>

Defined in: [src/drizzle/tables/communities.ts:114](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/communities.ts#L114)
