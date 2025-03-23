[Admin Docs](/)

***

# Variable: fundCampaignsTableRelations

> `const` **fundCampaignsTableRelations**: `Relations`\<`"fund_campaigns"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fund`: `One`\<`"funds"`, `true`\>; `fundCampaignPledgesWhereCampaign`: `Many`\<`"fund_campaign_pledges"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/fundCampaigns.ts:113](https://github.com/NishantSinghhhhh/talawa-api/blob/80d33ad4356836957a519774ac35d2e1e92179d5/src/drizzle/tables/fundCampaigns.ts#L113)
