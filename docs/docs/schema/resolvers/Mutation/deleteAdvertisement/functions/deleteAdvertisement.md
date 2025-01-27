[**talawa-api**](../../../../README.md)

***

# Function: deleteAdvertisement()

> **deleteAdvertisement**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`DeleteAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeleteAdvertisementPayload.md), `"advertisement"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`DeleteAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeleteAdvertisementPayload.md), `"advertisement"`\> & `object`\>\>

Deletes an advertisement based on the provided advertisement ID.

This function handles the deletion of an advertisement by first verifying
that the current user is authorized to perform this action. It checks
whether the user exists in the cache or database, retrieves the user's
profile, and ensures that the user has the necessary permissions to delete
the advertisement. If the advertisement exists and the user is authorized,
it will be deleted, and the deleted advertisement's details will be returned.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationDeleteAdvertisementArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationDeleteAdvertisementArgs.md), `"id"`\>

Contains the arguments passed to the GraphQL mutation, specifically the ID of the advertisement to be deleted.

### context

`any`

Provides contextual information such as the current user's ID and API root URL. This is used to find the user and validate permissions.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`DeleteAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeleteAdvertisementPayload.md), `"advertisement"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`DeleteAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/DeleteAdvertisementPayload.md), `"advertisement"`\> & `object`\>\>

The deleted advertisement's details, including the advertisement ID and media URL, if the deletion was successful.

## Defined in

[src/resolvers/Mutation/deleteAdvertisement.ts:32](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/deleteAdvertisement.ts#L32)
