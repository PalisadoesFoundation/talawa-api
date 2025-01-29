[**talawa-api**](../../../../README.md)

***

# Function: createSampleOrganization()

> **createSampleOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

Generates sample data for testing or development purposes.

This resolver performs the following steps:

1. Verifies that the current user exists and is fetched from the cache or database.
2. Checks if the current user has a valid application profile and whether they are authorized.
3. Ensures that the current user is a super admin.
4. Utilizes a utility function to create a sample organization.

## Parameters

### parent

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

True if the sample data generation is successful; false otherwise.

## Remarks

This function is intended for creating sample data and should only be accessible by super admins.

## Defined in

[src/resolvers/Mutation/createSampleOrganization.ts:33](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createSampleOrganization.ts#L33)
