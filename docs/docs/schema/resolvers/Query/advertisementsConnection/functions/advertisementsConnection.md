[**talawa-api**](../../../../README.md)

***

# Function: advertisementsConnection()

> **advertisementsConnection**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\>\>

Retrieves a paginated list of advertisements based on the provided connection arguments.

This function handles querying and pagination of advertisements using connection arguments. It performs validation of the connection arguments, applies filters and sorting, and then returns a paginated result containing the advertisements. The media URLs for each advertisement are adjusted based on the API root URL provided in the context.

## Parameters

### parent

### args

`Partial`\<[`QueryAdvertisementsConnectionArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryAdvertisementsConnectionArgs.md)\>

The arguments passed to the GraphQL query, including pagination and filter criteria.

### context

`any`

Provides contextual information, including the API root URL. This is used to construct the media URLs for the advertisements.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`AdvertisementsConnection`](../../../../types/generatedGraphQLTypes/type-aliases/AdvertisementsConnection.md), `"edges"`\> & `object`\>\>

A paginated connection object containing the advertisements, their total count, and the pagination information.

## Defined in

[src/resolvers/Query/advertisementsConnection.ts:28](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Query/advertisementsConnection.ts#L28)
