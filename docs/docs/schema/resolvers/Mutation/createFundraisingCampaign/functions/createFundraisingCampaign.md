[**talawa-api**](../../../../README.md)

***

# Function: createFundraisingCampaign()

> **createFundraisingCampaign**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>\>

Creates a new fundraising campaign and associates it with a specified fund.

This resolver performs the following actions:

1. Validates the existence of the current user.
2. Checks if the user has an associated profile and if they are authorized.
3. Ensures that a fundraising campaign with the same name does not already exist.
4. Validates the provided start and end dates for the campaign.
5. Verifies the existence of the specified fund and checks if the user is authorized to create a campaign for the fund.
6. Creates a new fundraising campaign and associates it with the fund.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateFundraisingCampaignArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateFundraisingCampaignArgs.md), `"data"`\>

The input arguments for the mutation, including:
  - `data`: An object containing:
    - `name`: The name of the fundraising campaign.
    - `fundId`: The ID of the fund to associate the campaign with.
    - `startDate`: The start date of the campaign.
    - `endDate`: The end date of the campaign.
    - `fundingGoal`: The funding goal for the campaign.
    - `currency`: The currency for the funding goal.

### context

`any`

The context object containing user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFundraisingCampaign`](../../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)\>\>

A promise that resolves to the created fundraising campaign object.

## Remarks

This function checks the cache for user and profile data, validates inputs, and ensures the user has the necessary permissions before creating the campaign.

## Defined in

[src/resolvers/Mutation/createFundraisingCampaign.ts:45](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/createFundraisingCampaign.ts#L45)
