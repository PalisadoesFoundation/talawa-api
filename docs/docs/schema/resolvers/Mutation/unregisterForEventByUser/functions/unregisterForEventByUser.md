[**talawa-api**](../../../../README.md)

***

# Function: unregisterForEventByUser()

> **unregisterForEventByUser**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

This function enables a user to unregister from an event.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUnregisterForEventByUserArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUnregisterForEventByUserArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceEvent`](../../../../models/Event/interfaces/InterfaceEvent.md)\>\>

Updated event.

## Remarks

The following checks are done:
1. If the user exists.
2. If the event exists.
3. If the user is a registrant of the event.

## Defined in

[src/resolvers/Mutation/unregisterForEventByUser.ts:24](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/unregisterForEventByUser.ts#L24)
