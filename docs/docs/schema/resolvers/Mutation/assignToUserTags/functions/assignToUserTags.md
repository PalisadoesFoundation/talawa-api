[**talawa-api**](../../../../README.md)

***

# Function: assignToUserTags()

> **assignToUserTags**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

This function enables an admin to assign multiple tags to users with a specified tag.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAssignToUserTagsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAssignToUserTagsArgs.md), `"input"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

Array of tags that were assigned to users.

## Remarks

The following checks are done:
1. If the current user exists and has a profile.
2. If the current user is an admin for the organization of the tags.
3. If the currentTagId exists and the selected tags exist.
4. Assign the tags to users who have the currentTagId.

## Defined in

[src/resolvers/Mutation/assignToUserTags.ts:37](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/assignToUserTags.ts#L37)
