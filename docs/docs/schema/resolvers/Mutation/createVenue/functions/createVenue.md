[**talawa-api**](../../../../README.md)

***

# Function: createVenue()

> **createVenue**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>\>

Creates a new venue within an organization, if the user has appropriate permissions and the venue does not already exist.

This resolver performs the following checks:

1. Verifies the existence of the user and fetches their profile.
2. Checks if the specified organization exists.
3. Ensures the user is authorized to create a venue by verifying their admin or superadmin status within the organization.
4. Validates that a venue name is provided.
5. Ensures that no venue with the same name already exists within the organization.
6. Uploads an image if provided and associates it with the venue.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateVenueArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateVenueArgs.md), `"data"`\>

The input arguments for the mutation, including the venue details and organization ID.

### context

`any`

The context object, including the user ID, API root URL, and other necessary context for authorization and image upload.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceVenue`](../../../../models/Venue/interfaces/InterfaceVenue.md)\>\>

The created venue object, including the associated organization.

## Remarks

This function includes validation for user authorization, venue uniqueness, and handles image uploads if applicable.

## Defined in

[src/resolvers/Mutation/createVenue.ts:40](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createVenue.ts#L40)
