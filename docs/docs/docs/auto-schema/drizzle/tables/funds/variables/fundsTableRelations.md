[Admin Docs](/)

***

# Variable: fundsTableRelations

> `const` **fundsTableRelations**: `Relations`\<`"funds"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fundCampaignsWhereFund`: `Many`\<`"fund_campaigns"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/funds.ts:88](https://github.com/PurnenduMIshra129th/talawa-api/blob/8bb4483f6aa0d175e00d3d589e36182f9c58a66a/src/drizzle/tables/funds.ts#L88)
