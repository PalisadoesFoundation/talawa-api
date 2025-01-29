[**talawa-api**](../../../../README.md)

***

# Function: updateFundraisingCampaignPledge()

> **updateFundraisingCampaignPledge**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

This function enables to update a fundraising campaign pledge.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateFundraisingCampaignPledgeArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateFundraisingCampaignPledgeArgs.md), `"data"` \| `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

Updated campaign pledge.

## Remarks

The following checks are done:
1. If the user exists.
2. If the FundraisingCampaignPledge exists.
3. If the user has made the pledge.
4. If the start date is valid.
5. If the end date is valid.

## Defined in

[src/resolvers/Mutation/updateFundCampaignPledge.ts:32](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/updateFundCampaignPledge.ts#L32)
