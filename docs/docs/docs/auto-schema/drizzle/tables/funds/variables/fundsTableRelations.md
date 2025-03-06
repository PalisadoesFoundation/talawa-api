[Admin Docs](/)

***

# Variable: fundsTableRelations

> `const` **fundsTableRelations**: `Relations`\<`"funds"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fundCampaignsWhereFund`: `Many`\<`"fund_campaigns"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/funds.ts:88](https://github.com/PurnenduMIshra129th/talawa-api/blob/4369c9351f5b76f958b297b25ab2b17196210af9/src/drizzle/tables/funds.ts#L88)
