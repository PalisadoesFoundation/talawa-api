[**talawa-api**](../../../../README.md)

***

# Variable: communitiesTableInsertSchema

> `const` **communitiesTableInsertSchema**: `BuildSchema`\<`"insert"`, \{ `createdAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `facebookURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `githubURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `inactivityTimeoutDuration`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `instagramURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `linkedinURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `logoMimeType`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `logoName`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `name`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `redditURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `slackURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `updaterId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `websiteURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `xURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `youtubeURL`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, \{ `facebookURL`: () => `ZodOptional`\<`ZodString`\>; `githubURL`: () => `ZodOptional`\<`ZodString`\>; `inactivityTimeoutDuration`: (`schema`) => `ZodOptional`\<`ZodInt`\>; `instagramURL`: () => `ZodOptional`\<`ZodString`\>; `linkedinURL`: () => `ZodOptional`\<`ZodString`\>; `logoName`: (`schema`) => `ZodOptional`\<`ZodString`\>; `name`: (`schema`) => `ZodString`; `redditURL`: () => `ZodOptional`\<`ZodString`\>; `slackURL`: () => `ZodOptional`\<`ZodString`\>; `websiteURL`: () => `ZodOptional`\<`ZodString`\>; `xURL`: () => `ZodOptional`\<`ZodString`\>; `youtubeURL`: () => `ZodOptional`\<`ZodString`\>; \}, `undefined`\>

Defined in: [src/drizzle/tables/communities.ts:114](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/drizzle/tables/communities.ts#L114)
