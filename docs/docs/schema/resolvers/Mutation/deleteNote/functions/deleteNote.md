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

[src/resolvers/Mutation/deleteNote.ts:25](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/resolvers/Mutation/deleteNote.ts#L25)
