[**talawa-api**](../../../../README.md)

***

# Function: getCommunityData()

> **getCommunityData**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCommunity`](../../../../models/Community/interfaces/InterfaceCommunity.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCommunity`](../../../../models/Community/interfaces/InterfaceCommunity.md)\>\>

This query will fetch the community data from the database.

## Parameters

### parent

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCommunity`](../../../../models/Community/interfaces/InterfaceCommunity.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceCommunity`](../../../../models/Community/interfaces/InterfaceCommunity.md)\>\>

A `community` object or if it does not exits then it will return null.

## Remarks

You can learn about GraphQL `Resolvers`
[here](https://www.apollographql.com/docs/apollo-server/data/resolvers/).

## Defined in

[src/resolvers/Query/getCommunityData.ts:11](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getCommunityData.ts#L11)
