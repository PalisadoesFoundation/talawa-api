[Admin Docs](/)

***

# Function: deleteAgendaCategory()

> **deleteAgendaCategory**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

This is a resolver function for the GraphQL mutation 'deleteAgendaCategory'.

This resolver deletes an agenda category if the user has the necessary permissions.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationDeleteAgendaCategoryArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationDeleteAgendaCategoryArgs.md), `"id"`\>

The input arguments for the mutation.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<`string`\>\>

A promise that resolves to the ID of the deleted agenda category.

## Throws

`NotFoundError` If the user or agenda category is not found.

## Throws

`UnauthorizedError` If the user does not have the required permissions.

## Throws

`InternalServerError` For other potential issues during agenda category deletion.

## Defined in

[src/resolvers/Mutation/deleteAgendaCategory.ts:29](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/resolvers/Mutation/deleteAgendaCategory.ts#L29)
