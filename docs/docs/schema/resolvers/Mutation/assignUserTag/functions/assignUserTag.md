[**talawa-api**](../../../../README.md)

***

# Function: assignUserTag()

> **assignUserTag**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

This function enables an admin to assign tag to user or not.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAssignUserTagArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAssignUserTagArgs.md), `"input"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUser`](../../../../models/User/interfaces/InterfaceUser.md)\>\>

User to which the tag is assigned.

## Remarks

The following checks are done:
1. If the user exists.
2. If the user has appProfile.
3. If the tag object exists.
4. If the user is an admin for the organization.
5. If the user to be assigned the tag exists.
6. If the user to be assigned the tag belongs to the tag's organization.
7. If the user already has the tag.

## Defined in

[src/resolvers/Mutation/assignUserTag.ts:39](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/assignUserTag.ts#L39)
