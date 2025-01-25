[Admin Docs](/)

***

# Variable: fundsTableRelations

> `const` **fundsTableRelations**: `Relations`\<`"funds"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fundCampaignsWhereFund`: `Many`\<`"fund_campaigns"`\>; `organization`: `One`\<`"organizations"`, `true`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/funds.ts:88](https://github.com/PalisadoesFoundation/talawa-api/blob/c34688c69eb12a5eb721ebc8a0cd60b53e5fbf81/src/drizzle/tables/funds.ts#L88)
