[**talawa-api**](../../../../README.md)

***

# Function: usersConnection()

> **usersConnection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[]\>

This query will fetch all the users in a specified order to paginate from the database.

## Parameters

### parent

### args

`Partial`\<[`QueryUsersConnectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryUsersConnectionArgs.md)\>

An object that contains relevant data to execute the query.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[]\>

An object that contains list of the users.

## Remarks

Connection in graphQL means pagination,
learn more about Connection [here](https://relay.dev/graphql/connections.htm).

## Defined in

[src/resolvers/Query/usersConnection.ts:16](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/usersConnection.ts#L16)
