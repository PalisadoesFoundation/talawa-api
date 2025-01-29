[Admin Docs](/)

***

# Function: rejectMembershipRequest()

> **rejectMembershipRequest**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\>\>

This function enables to reject membership request.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRejectMembershipRequestArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRejectMembershipRequestArgs.md), `"membershipRequestId"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceMembershipRequest`](../../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)\>\>

Deleted membership request.

## Remarks

The following checks are done:
1. If the membership request exists.
2. If the organization exists.
3. If the user to be rejected exists.
4. If the user is the admin of the organization.

## Defined in

[src/resolvers/Mutation/rejectMembershipRequest.ts:23](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/rejectMembershipRequest.ts#L23)
