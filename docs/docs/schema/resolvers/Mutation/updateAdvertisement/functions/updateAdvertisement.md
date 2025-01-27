[**talawa-api**](../../../../README.md)

***

# Function: updateAdvertisement()

> **updateAdvertisement**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UpdateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/UpdateAdvertisementPayload.md), `"advertisement"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UpdateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/UpdateAdvertisementPayload.md), `"advertisement"`\> & `object`\>\>

Updates an advertisement with new details, including handling media file uploads and validating input fields.

This function updates an existing advertisement based on the provided input. It checks for required fields, validates dates, handles media file uploads, and performs authorization checks to ensure that the current user has the right to update the advertisement. The function returns the updated advertisement after applying changes.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateAdvertisementArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateAdvertisementArgs.md), `"input"`\>

The arguments passed to the GraphQL mutation, including the advertisement's `_id` and other fields to update. This may include `startDate`, `endDate`, and `mediaFile`.

### context

`any`

Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UpdateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/UpdateAdvertisementPayload.md), `"advertisement"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UpdateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/UpdateAdvertisementPayload.md), `"advertisement"`\> & `object`\>\>

An object containing the updated advertisement with all its fields.

## Defined in

[src/resolvers/Mutation/updateAdvertisement.ts:37](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/updateAdvertisement.ts#L37)
