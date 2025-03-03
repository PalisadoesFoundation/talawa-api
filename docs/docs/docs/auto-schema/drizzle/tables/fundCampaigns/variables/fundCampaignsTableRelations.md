[Admin Docs](/)

***

# Variable: fundCampaignsTableRelations

> `const` **fundCampaignsTableRelations**: `Relations`\<`"fund_campaigns"`, \{ `creator`: `One`\<`"users"`, `false`\>; `fund`: `One`\<`"funds"`, `true`\>; `fundCampaignPledgesWhereCampaign`: `Many`\<`"fund_campaign_pledges"`\>; `updater`: `One`\<`"users"`, `false`\>; \}\>

## Defined in

[src/drizzle/tables/fundCampaigns.ts:113](https://github.com/NishantSinghhhhh/talawa-api/blob/05ae6a4794762096d917a90a3af0db22b7c47392/src/drizzle/tables/fundCampaigns.ts#L113)
