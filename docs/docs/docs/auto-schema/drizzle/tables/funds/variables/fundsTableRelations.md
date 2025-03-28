[Admin Docs](/)

***

# Variable: fundsTableRelations

> `const` **fundsTableRelations**: `Relations`\<`"funds"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fundCampaignsWhereFund`: `Many`\<`"fund_campaigns"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/funds.ts:88](https://github.com/NishantSinghhhhh/talawa-api/blob/eec373445d0a4b36c011832ad5010e69e112315d/src/drizzle/tables/funds.ts#L88)
