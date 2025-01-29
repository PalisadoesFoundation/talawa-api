[**talawa-api**](../../../../README.md)

***

# Function: venues()

> **venues**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[]\>

Resolver function for the `venues` field of an `Organization`.

This function retrieves the venues related to a specific organization.

## Parameters

### parent

[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)

The parent object representing the organization. It contains information about the organization, including the ID of the organization.

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>[]\>

A promise that resolves to the venue documents found in the database. These documents represent the venues related to the organization.

## See

 - Venue - The Venue model used to interact with the venues collection in the database.
 - OrganizationResolvers - The type definition for the resolvers of the Organization fields.

## Defined in

[src/resolvers/Organization/venues.ts:16](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Organization/venues.ts#L16)
