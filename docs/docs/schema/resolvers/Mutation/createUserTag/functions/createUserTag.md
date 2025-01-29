[**talawa-api**](../../../../README.md)

***

# Function: createUserTag()

> **createUserTag**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

Creates a new tag for an organization if the user is authorized to do so.

This resolver performs the following steps:

1. Verifies that the current user exists and is fetched from the cache or database.
2. Checks if the current user has an application profile.
3. Ensures the current user is authorized to create a tag by being either a super admin or an admin for the specified organization.
4. Checks if the provided organization exists.
5. Validates that the parent tag (if provided) belongs to the specified organization.
6. Ensures no other tag with the same name exists under the same parent tag.
7. Creates a new tag if all validation checks pass.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateUserTagArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateUserTagArgs.md), `"input"`\>

The input arguments for the mutation, including the tag details and organization ID.

### context

`any`

The context object, including the user ID and other necessary context for authorization.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

The created tag object.

## Remarks

This function is intended for creating new tags within an organization and includes validation to ensure the integrity of the tag creation process.

## Defined in

[src/resolvers/Mutation/createUserTag.ts:46](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/createUserTag.ts#L46)
