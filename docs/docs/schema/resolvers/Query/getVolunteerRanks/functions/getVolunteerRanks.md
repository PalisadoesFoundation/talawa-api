[**talawa-api**](../../../../README.md)

***

# Function: getVolunteerRanks()

> **getVolunteerRanks**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`VolunteerRank`](../../../../types/generatedGraphQLTypes/type-aliases/VolunteerRank.md), `"user"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`VolunteerRank`](../../../../types/generatedGraphQLTypes/type-aliases/VolunteerRank.md), `"user"`\> & `object`\>[]\>

This query will fetch volunteer ranks based on the provided time frame (allTime, weekly, monthly, yearly),
and it will filter the results based on an array of volunteer IDs.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetVolunteerRanksArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetVolunteerRanksArgs.md), `"orgId"` \| `"where"`\>

An object that contains where object for volunteer ranks.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`VolunteerRank`](../../../../types/generatedGraphQLTypes/type-aliases/VolunteerRank.md), `"user"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`VolunteerRank`](../../../../types/generatedGraphQLTypes/type-aliases/VolunteerRank.md), `"user"`\> & `object`\>[]\>

An array of `VolunteerRank` object.

## Defined in

[src/resolvers/Query/getVolunteerRanks.ts:14](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/getVolunteerRanks.ts#L14)
