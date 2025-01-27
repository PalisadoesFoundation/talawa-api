[**talawa-api**](../../../../README.md)

***

# Function: getFundraisingCampaigns()

> **getFundraisingCampaigns**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>[]\>

This query will fetch the fundraisingCampaign as a transaction from database.

## Parameters

### parent

### args

`Partial`\<[`QueryGetFundraisingCampaignsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetFundraisingCampaignsArgs.md)\>

An object that contains `id` of the campaign.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>[]\>

A `fundraisingCampaign` object.

## Defined in

[src/resolvers/Query/getFundraisingCampaigns.ts:11](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/getFundraisingCampaigns.ts#L11)
