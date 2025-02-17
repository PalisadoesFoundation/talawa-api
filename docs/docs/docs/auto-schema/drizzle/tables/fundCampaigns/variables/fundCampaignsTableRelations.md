[Admin Docs](/)

***

# Variable: fundCampaignsTableRelations

> `const` **fundCampaignsTableRelations**: `Relations`\<`"fund_campaigns"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fund`: `One`\<`"funds"`, `true`\>; `fundCampaignPledgesWhereCampaign`: `Many`\<`"fund_campaign_pledges"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/fundCampaigns.ts:113](https://github.com/Suyash878/talawa-api/blob/3646aad880eea5a7cfb665aa9031a4d873c30798/src/drizzle/tables/fundCampaigns.ts#L113)
