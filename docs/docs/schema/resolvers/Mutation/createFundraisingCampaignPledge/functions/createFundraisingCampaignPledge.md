[**talawa-api**](../../../../README.md)

***

# Function: createFundraisingCampaignPledge()

> **createFundraisingCampaignPledge**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

Creates a new pledge for a fundraising campaign.

This function performs the following actions:
1. Verifies the existence of the current user.
2. Retrieves and caches the user's details if not already cached.
3. Checks the validity of the provided or default campaign start and end dates.
4. Verifies the existence of the specified fundraising campaign.
5. Creates a new pledge for the specified campaign with the given details.
6. Updates the campaign to include the newly created pledge.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateFundraisingCampaignPledgeArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateFundraisingCampaignPledgeArgs.md), `"data"`\>

The arguments for the mutation, including:
  - `data.campaignId`: The ID of the fundraising campaign for which the pledge is being created.
  - `data.userIds`: An array of user IDs associated with the pledge.
  - `data.startDate`: The start date of the pledge (optional; defaults to the campaign's start date).
  - `data.endDate`: The end date of the pledge (optional; defaults to the campaign's end date).
  - `data.amount`: The amount pledged.
  - `data.currency`: The currency of the pledged amount.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user performing the operation.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaignPledges`](../../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)\>\>

The created pledge record.

## Defined in

[src/resolvers/Mutation/createFundraisingCampaignPledge.ts:42](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createFundraisingCampaignPledge.ts#L42)
