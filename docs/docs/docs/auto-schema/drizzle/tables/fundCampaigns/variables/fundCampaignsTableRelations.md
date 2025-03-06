[Admin Docs](/)

***

# Variable: fundCampaignsTableRelations

> `const` **fundCampaignsTableRelations**: `Relations`\<`"fund_campaigns"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fund`: `One`\<`"funds"`, `true`\>; `fundCampaignPledgesWhereCampaign`: `Many`\<`"fund_campaign_pledges"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/fundCampaigns.ts:113](https://github.com/PurnenduMIshra129th/talawa-api/blob/4369c9351f5b76f958b297b25ab2b17196210af9/src/drizzle/tables/fundCampaigns.ts#L113)
