[Admin Docs](/)

***

# Variable: fundCampaignsTableRelations

> `const` **fundCampaignsTableRelations**: `Relations`\<`"fund_campaigns"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fund`: `One`\<`"funds"`, `true`\>; `fundCampaignPledgesWhereCampaign`: `Many`\<`"fund_campaign_pledges"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/fundCampaigns.ts:113](https://github.com/PalisadoesFoundation/talawa-api/blob/c34688c69eb12a5eb721ebc8a0cd60b53e5fbf81/src/drizzle/tables/fundCampaigns.ts#L113)
