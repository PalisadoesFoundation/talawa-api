[Admin Docs](/)

***

# Function: removeOrganization()

> **removeOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

This function enables to remove an organization.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveOrganizationArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`Omit`](../../../../types/generatedGraphQLTypes/type-aliases/Omit.md)\<[`UserData`](../../../../types/generatedGraphQLTypes/type-aliases/UserData.md), `"appUserProfile"` \| `"user"`\> & `object`\>\>

Updated user.

## Remarks

The following checks are done:
1. If the user exists.
2. If the organization exists
3. If the user is the creator of the organization.
4. If the user has appUserProfile.

## Defined in

[src/resolvers/Mutation/removeOrganization.ts:45](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/removeOrganization.ts#L45)
