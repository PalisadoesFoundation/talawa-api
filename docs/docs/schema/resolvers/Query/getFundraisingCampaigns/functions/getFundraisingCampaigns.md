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

[src/resolvers/Query/getFundraisingCampaigns.ts:11](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getFundraisingCampaigns.ts#L11)
