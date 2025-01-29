[**talawa-api**](../../../../README.md)

***

# Function: users()

> **users**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[]\>

This query will fetch all the users in specified order from the database.

## Parameters

### parent

### args

`Partial`\<[`QueryUsersArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryUsersArgs.md)\>

An object that contains relevant data to perform the query.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>[]\>

An object that contains the list of all the users.

## Remarks

The query function uses `getSort()` function to sort the data in specified.

## Defined in

[src/resolvers/Query/users.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/users.ts#L17)
