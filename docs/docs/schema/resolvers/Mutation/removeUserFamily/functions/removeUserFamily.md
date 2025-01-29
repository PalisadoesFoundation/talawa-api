[**talawa-api**](../../../../README.md)

***

# Function: removeUserFamily()

> **removeUserFamily**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

This function enables to remove a user family.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveUserFamilyArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveUserFamilyArgs.md), `"familyId"`\>

payload provided with the request

### context

`any`

context of entire application.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceUserFamily`](../../../../models/userFamily/interfaces/InterfaceUserFamily.md)\>\>

Deleted user family.

## Remarks

- The following checks are done:
1. If the user family exists.
2. If the user is super admin.

## Defined in

[src/resolvers/Mutation/removeUserFamily.ts:26](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/removeUserFamily.ts#L26)
