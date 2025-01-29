[Admin Docs](/)

***

# Function: removeFundraisingCampaignPledge()

> **removeFundraisingCampaignPledge**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

This function enables to remove fundraising campaign pledge .

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveFundraisingCampaignPledgeArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveFundraisingCampaignPledgeArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

Deleted fundraising campaign pledge.

## Remarks

The following checks are done:
1. If the user exists
2. If the fundraising campaign pledge exists.
3. If the user has made the pledge.

## Defined in

[src/resolvers/Mutation/removeFundraisingCampaingPledge.ts:28](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/removeFundraisingCampaingPledge.ts#L28)
