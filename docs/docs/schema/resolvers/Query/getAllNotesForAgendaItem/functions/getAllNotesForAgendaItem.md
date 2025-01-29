[**talawa-api**](../../../../README.md)

***

# Function: getAllNotesForAgendaItem()

> **getAllNotesForAgendaItem**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>[]\>

Retrieves all notes associated with a specific agenda item from the database.

This function performs the following steps:
1. Queries the database for notes that are associated with the specified agenda item ID.
2. Returns the list of notes for the given agenda item.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetAllNotesForAgendaItemArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetAllNotesForAgendaItemArgs.md), `"agendaItemId"`\>

The arguments provided by the GraphQL query, including the agenda item ID (`agendaItemId`) for which notes are to be retrieved.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>[]\>

A list of notes associated with the specified agenda item.

## Defined in

[src/resolvers/Query/getAllNotesForAgendaItem.ts:17](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/getAllNotesForAgendaItem.ts#L17)
