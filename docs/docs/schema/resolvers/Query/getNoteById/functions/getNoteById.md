[**talawa-api**](../../../../README.md)

***

# Function: getNoteById()

> **getNoteById**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>\>

Retrieves a note by its ID from the database.

This function performs the following steps:
1. Queries the database to find a `Note` record by the provided ID.
2. If the note is not found, throws a `NotFoundError` with a predefined error message.
3. Returns the note record if found.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`QueryGetNoteByIdArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryGetNoteByIdArgs.md), `"id"`\>

The arguments provided by the GraphQL query, including:
  - `id`: The ID of the note to be retrieved.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>\>

The note record corresponding to the provided ID.

## Defined in

[src/resolvers/Query/getNoteById.ts:22](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Query/getNoteById.ts#L22)
