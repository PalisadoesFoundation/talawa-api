[**talawa-api**](../../../../README.md)

***

# Function: addPledgeToFundraisingCampaign()

> **addPledgeToFundraisingCampaign**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

Mutation resolver to add a pledge to a fundraising campaign.

This function adds a specified pledge to a fundraising campaign. It performs several checks:

1. Verifies that the current user exists.
2. Confirms that the pledge exists.
3. Checks that the campaign exists.
4. Ensures the user has made the pledge.
5. Verifies that the campaign is not already associated with the pledge.

If any of these conditions are not met, appropriate errors are thrown.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAddPledgeToFundraisingCampaignArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAddPledgeToFundraisingCampaignArgs.md), `"campaignId"` \| `"pledgeId"`\>

The arguments provided with the request, including:
  - `pledgeId`: The ID of the pledge to be added.
  - `campaignId`: The ID of the campaign to which the pledge will be added.

### context

`any`

The context of the entire application, containing user information and other context-specific data.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

A promise that resolves to the updated pledge object.

## Defined in

[src/resolvers/Mutation/addPledgeToFundraisingCampaign.ts:41](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/addPledgeToFundraisingCampaign.ts#L41)
