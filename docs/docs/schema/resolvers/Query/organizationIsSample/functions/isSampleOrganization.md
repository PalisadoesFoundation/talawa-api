[**talawa-api**](../../../../README.md)

***

# Function: isSampleOrganization()

> **isSampleOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

Checks whether the specified organization is a sample organization.

This function performs the following steps:
1. Retrieves the organization from the database using the provided organization ID.
2. If the organization is not found, throws an unauthorized error.
3. Searches for a sample document associated with the organization ID in the `SampleData` collection.
4. Returns `true` if the sample document is found, indicating the organization is a sample organization; otherwise, returns `false`.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryIsSampleOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryIsSampleOrganizationArgs.md), `"id"`\>

The arguments provided by the GraphQL query, including:
  - `id`: The ID of the organization to check.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

A promise that resolves to `true` if the organization is a sample organization, otherwise `false`.

## Defined in

[src/resolvers/Query/organizationIsSample.ts:21](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Query/organizationIsSample.ts#L21)
