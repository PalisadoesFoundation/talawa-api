[Admin Docs](/)

***

# Variable: fundsTableRelations

> `const` **fundsTableRelations**: `Relations`\<`"funds"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fundCampaignsWhereFund`: `Many`\<`"fund_campaigns"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/funds.ts:88](https://github.com/NishantSinghhhhh/talawa-api/blob/d7e8fb10f99b66342acb17768b9755553b21ad54/src/drizzle/tables/funds.ts#L88)
