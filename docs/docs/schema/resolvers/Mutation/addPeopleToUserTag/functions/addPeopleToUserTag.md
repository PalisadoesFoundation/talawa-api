[Admin Docs](/)

***

# Function: addPeopleToUserTag()

> **addPeopleToUserTag**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

This function enables an admin to assign a tag to multiple users.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAddPeopleToUserTagArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAddPeopleToUserTagArgs.md), `"input"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganizationTagUser`](../../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)\>\>

Array of users to whom the tag was assigned.

## Remarks

The following checks are done:
1. If the current user exists and has a profile.
2. If the tag object exists.
3. If the current user is an admin for the organization of the tag.
4. If each user to be assigned the tag exists and belongs to the tag's organization.
5. Assign the tag only to users who do not already have it.

## Defined in

[src/resolvers/Mutation/addPeopleToUserTag.ts:36](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/addPeopleToUserTag.ts#L36)
