[**talawa-api**](../../../../README.md)

***

# Function: organizationsMemberConnection()

> **organizationsMemberConnection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserConnection.md), `"edges"`\> & `object`\>\>

This query will retrieve from the database a list of members
in the organisation under the specified limit for the specified page in the pagination.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryOrganizationsMemberConnectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryOrganizationsMemberConnectionArgs.md), `"orgId"`\>

An object holds the data required to execute the query.
`args.first` specifies the number of members to retrieve, and `args.after` specifies
the unique identification for each item in the returned list.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserConnection`](../../../../types/generatedGraphQLTypes/type-aliases/UserConnection.md), `"edges"`\> & `object`\>\>

An object containing the list of members and pagination information.

## Remarks

Connection in graphQL means pagination,
learn more about Connection [here](https://relay.dev/graphql/connections.htm).

## Defined in

[src/resolvers/Query/organizationsMemberConnection.ts:19](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/organizationsMemberConnection.ts#L19)
