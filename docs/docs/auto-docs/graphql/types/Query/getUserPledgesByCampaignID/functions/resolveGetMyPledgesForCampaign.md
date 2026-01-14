[**talawa-api**](../../../../../README.md)

***

# Function: resolveGetMyPledgesForCampaign()

> **resolveGetMyPledgesForCampaign**(`_parent`, `args`, `ctx`): `Promise`\<`object`[]\>

Defined in: [src/graphql/types/Query/getUserPledgesByCampaignID.ts:13](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/graphql/types/Query/getUserPledgesByCampaignID.ts#L13)

Resolver function to get pledges for the current user in a specific campaign.

## Parameters

### \_parent

`Record`\<`string`, `unknown`\>

Parent object (unused)

### args

Arguments containing campaignId

#### campaignId

`string`

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

GraphQL context

## Returns

`Promise`\<`object`[]\>

- Array of fund campaign pledges
