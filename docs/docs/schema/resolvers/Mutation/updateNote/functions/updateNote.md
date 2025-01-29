[**talawa-api**](../../../../README.md)

***

# Function: updateNote()

> **updateNote**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>\>

Updates an existing note in the system.

This function updates a specific note in the database. It first checks if the current user
exists and if they have the proper profile. Then it verifies if the note exists and whether
the current user is authorized to update it. If all checks pass, the function updates the note
with the provided data.

The function performs the following steps:
1. Retrieves the current user from the cache or database.
2. Verifies if the current user exists.
3. Retrieves the current user's profile from the cache or database.
4. Checks if the user has the necessary authorization to update the note.
5. Finds the note to be updated in the database.
6. Verifies that the note belongs to the current user.
7. Updates the note with the new data provided.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationUpdateNoteArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationUpdateNoteArgs.md), `"data"` \| `"id"`\>

The arguments provided by the GraphQL query, including the ID of the note to be updated and the new data.

### context

`any`

The context of the request, containing information about the currently authenticated user.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceNote`](../../../../models/Note/interfaces/InterfaceNote.md)\>\>

The updated note.

## Defined in

[src/resolvers/Mutation/updateNote.ts:44](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/updateNote.ts#L44)
