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

[src/resolvers/Mutation/removeSampleOrganization.ts:31](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/removeSampleOrganization.ts#L31)
