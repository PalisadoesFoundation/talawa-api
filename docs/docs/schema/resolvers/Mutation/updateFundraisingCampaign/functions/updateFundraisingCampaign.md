[**talawa-api**](../../../../README.md)

***

# Function: updateFundraisingCampaign()

> **updateFundraisingCampaign**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>\>

This function enables to update a fundraising campaign.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateFundraisingCampaignArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateFundraisingCampaignArgs.md), `"data"` \| `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>\>

Updated campaign.

## Remarks

The following checks are done:
1. If the user exists.
2. If the FundraisingCampaign exists.
3. If the user is authorized to update the fundraising campaign.
4. If the fundraising campaign already exists with the same name.
5. If the start date is valid.
6. If the end date is valid.

## Defined in

[src/resolvers/Mutation/updateFundraisingCampaign.ts:42](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/updateFundraisingCampaign.ts#L42)
