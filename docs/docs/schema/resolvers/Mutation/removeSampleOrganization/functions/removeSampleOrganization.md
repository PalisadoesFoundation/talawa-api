[**talawa-api**](../../../../README.md)

***

# Function: removeSampleOrganization()

> **removeSampleOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

Removes a sample organization from the system.

This function allows the deletion of a sample organization by checking the current user's authorization and the existence of the organization.
The function first verifies whether the user making the request is authorized by checking if they are either a super admin or an admin of the organization.
If the user is authorized and the organization exists, the organization is removed from the system.

## Parameters

### parent

### args

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`boolean`\>\>

A boolean value indicating whether the operation was successful.

## Defined in

[src/resolvers/Mutation/removeSampleOrganization.ts:31](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/removeSampleOrganization.ts#L31)
