[**talawa-api**](../../../../README.md)

***

# Function: venue()

> **venue**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>\>

This query fetch the venue from the database.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryVenueArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryVenueArgs.md), `"id"`\>

An object that contains `id` for the venue.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>\>

An object that contains venue data. If the venue is not found then it throws a `NotFoundError` error.

## Defined in

[src/resolvers/Query/venue.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/venue.ts#L16)
