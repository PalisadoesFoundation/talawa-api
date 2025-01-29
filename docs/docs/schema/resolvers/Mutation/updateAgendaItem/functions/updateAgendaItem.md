[Admin Docs](/)

***

# Function: updateAgendaItem()

> **updateAgendaItem**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>\>

This function allows the user who created an agenda item to update it.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateAgendaItemArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateAgendaItemArgs.md), `"input"` \| `"id"`\>

The payload provided with the request.

### context

`any`

The context of the entire application.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceAgendaItem`](../../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)\>\>

The updated agenda item.

## Defined in

[src/resolvers/Mutation/updateAgendaItem.ts:30](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/updateAgendaItem.ts#L30)
