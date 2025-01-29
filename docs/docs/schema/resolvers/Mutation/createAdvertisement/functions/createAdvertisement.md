[Admin Docs](/)

***

# Function: createAdvertisement()

> **createAdvertisement**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdvertisementPayload.md), `"advertisement"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdvertisementPayload.md), `"advertisement"`\> & `object`\>\>

Mutation resolver function to create a new advertisement.

This function performs the following actions:
1. Verifies that the current user, identified by `context.userId`, exists.
2. Ensures that the organization specified by `args.input.organizationId` exists.
3. Uploads the media file if provided, determining its type (image or video).
4. Creates a new advertisement with the provided details.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateAdvertisementArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateAdvertisementArgs.md), `"input"`\>

The arguments for the mutation, including:
  - `input`: An object containing:
    - `organizationId`: The ID of the organization where the advertisement will be created.
    - `mediaFile`: The encoded media file (image or video) to be uploaded.
    - Other advertisement details.

### context

`any`

The context for the mutation, including:
  - `userId`: The ID of the current user making the request.
  - `apiRootUrl`: The root URL for the API to construct the media URL.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdvertisementPayload.md), `"advertisement"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`CreateAdvertisementPayload`](../../../../types/generatedGraphQLTypes/type-aliases/CreateAdvertisementPayload.md), `"advertisement"`\> & `object`\>\>

An object containing the created advertisement, including:
  - `advertisement`: The created advertisement details with the media URL.

## Defined in

[src/resolvers/Mutation/createAdvertisement.ts:37](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/createAdvertisement.ts#L37)
