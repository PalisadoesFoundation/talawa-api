[**talawa-api**](../../../../README.md)

***

# Function: deleteNote()

> **deleteNote**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

This function deletes a note.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationDeleteNoteArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationDeleteNoteArgs.md), `"id"`\>

payload provided with the request

### context

`any`

context of the entire application

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

ID of the deleted note.

## Throws

NotFoundError if the user or note is not found

## Throws

UnauthorizedError if the user is not the creator of the note.

## Defined in

[src/resolvers/Mutation/deleteNote.ts:25](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Mutation/deleteNote.ts#L25)
