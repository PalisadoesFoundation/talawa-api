[Admin Docs](/)

***

# Function: updateFund()

> **updateFund**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>\>

This function enables to update an organization specific fund.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateFundArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateFundArgs.md), `"data"` \| `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>\>

Updated Fund.

## Remarks

The following checks are done:
1. If the user exists.
2. If the Fund of the organization exists.
3. If the organization exists.
4.If the user is authorized to update the fund.
5. If the fund already exists with the same name.

## Defined in

[src/resolvers/Mutation/updateFund.ts:33](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/updateFund.ts#L33)
