[Admin Docs](/)

***

# Function: createNote()

> **createNote**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>\>

Creates a note for a specified agenda item.

This resolver performs the following actions:

1. Verifies the existence of the current user making the request.
2. Checks the user's app profile to ensure they are authenticated.
3. Checks if the specified agenda item exists.
4. Creates a new note associated with the agenda item.
5. Updates the agenda item to include the newly created note.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationCreateNoteArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateNoteArgs.md), `"data"`\>

The input arguments for the mutation, including:
  - `data`: An object containing:
    - `agendaItemId`: The ID of the agenda item to which the note will be added.
    - `content`: The content of the note.

### context

`any`

The context object containing user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>\>

The created note object.

## Remarks

This function creates a note, associates it with the specified agenda item, and updates the agenda item to include the new note. It also handles caching and error scenarios.

## Defined in

[src/resolvers/Mutation/createNote.ts:40](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/createNote.ts#L40)
