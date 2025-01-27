[**talawa-api**](../../../../README.md)

***

# Function: createFund()

> **createFund**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>\>

Creates a new fundraising fund for a specified organization.

This function performs the following actions:
1. Verifies the existence of the current user.
2. Retrieves and caches the user's profile if not already cached.
3. Verifies the existence of the specified organization.
4. Checks if the current user is an admin of the organization.
5. Verifies that the fund does not already exist for the given organization.
6. Creates a new fund with the provided details.
7. Updates the organization's list of funds to include the newly created fund.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateFundArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateFundArgs.md), `"data"`\>

The arguments for the mutation, including:
  - `data.organizationId`: The ID of the organization for which the fund is being created.
  - `data.name`: The name of the fund.
  - `data.refrenceNumber`: The reference number for the fund.
  - `data.taxDeductible`: Indicates if the fund is tax-deductible.
  - `data.isDefault`: Indicates if the fund is a default fund.
  - `data.isArchived`: Indicates if the fund is archived.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user performing the operation.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>\>

The created fund record.

## Defined in

[src/resolvers/Mutation/createFund.ts:43](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/createFund.ts#L43)
