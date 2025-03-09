[Admin Docs](/)

***

# Variable: fundCampaignsTableRelations

> `const` **fundCampaignsTableRelations**: `Relations`\<`"fund_campaigns"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fund`: `One`\<`"funds"`, `true`\>; `fundCampaignPledgesWhereCampaign`: `Many`\<`"fund_campaign_pledges"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

Defined in: [src/drizzle/tables/fundCampaigns.ts:113](https://github.com/syedali237/talawa-api/blob/98bc58250f2ff99b91cd3ae158cc2ad171f7d560/src/drizzle/tables/fundCampaigns.ts#L113)
