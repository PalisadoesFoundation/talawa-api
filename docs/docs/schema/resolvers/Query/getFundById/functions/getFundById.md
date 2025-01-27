[**talawa-api**](../../../../README.md)

***

# Function: getFundById()

> **getFundById**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>\>

This query will fetch the fund as a transaction from database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetFundByIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetFundByIdArgs.md), `"id"`\>

An object that contains `id` of the fund.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceFund`](../../../../models/Fund/interfaces/InterfaceFund.md)\>\>

A `fund` object.

## Defined in

[src/resolvers/Query/getFundById.ts:13](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/getFundById.ts#L13)
