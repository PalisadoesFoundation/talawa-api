[**talawa-api**](../../../../README.md)

***

# Function: removeUserFromUserFamily()

> **removeUserFromUserFamily**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

This function enables to remove a user from group chat.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveUserFromUserFamilyArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveUserFromUserFamilyArgs.md), `"userId"` \| `"familyId"`\>

payload provided with the request

### context

`any`

context of entire publication

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

Updated group chat.

## Remarks

The following checks are done:
1. If the family exists.
2. If the user to be removed is member of the organisation.
3. If the user is admin of the family

## Defined in

[src/resolvers/Mutation/removeUserFromUserFamily.ts:29](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/removeUserFromUserFamily.ts#L29)
