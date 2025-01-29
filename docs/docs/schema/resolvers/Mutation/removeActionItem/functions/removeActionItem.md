[**talawa-api**](../../../../README.md)

***

# Function: removeActionItem()

> **removeActionItem**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>\>

This function enables to remove an action item.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationRemoveActionItemArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationRemoveActionItemArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceActionItem`](../../../../models/ActionItem/interfaces/InterfaceActionItem.md)\>\>

deleted action item.

## Remarks

The following checks are done:
1. If the user exists.
2. If the action item exists.
3. If the user is authorized.
4. If the user has appUserProfile.

## Defined in

[src/resolvers/Mutation/removeActionItem.ts:35](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/removeActionItem.ts#L35)
